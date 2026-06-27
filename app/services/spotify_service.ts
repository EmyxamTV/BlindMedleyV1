import env from "#start/env";
import TrackCache from "#models/track_cache";
import Playlist from "#models/playlist";
import { DateTime } from "luxon";
import type {
  SpotifyPlaylistObject,
  SpotifyTokenResponse,
  SpotifyTrackObject,
} from "#types/spotify";

type ImportPlaylistOptions = {
  playlistKey?: string;
  createdBy?: number;
  visibility?: "public" | "private";
};

// Simple in-memory token cache (remplacé par Redis en prod)
let cachedToken: { value: string; expiresAt: number } | null = null;

export class SpotifyService {
  private readonly BASE_URL = "https://api.spotify.com/v1";

  async getServerToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
      return cachedToken.value;
    }

    const clientId = env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = env.get("SPOTIFY_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      throw new Error(`Spotify token fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as SpotifyTokenResponse;
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  }

  private async fetchSpotify<T>(path: string): Promise<T> {
    const token = await this.getServerToken();
    const res = await fetch(`${this.BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 1);
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }

    if (!res.ok) {
      throw new Error(`Spotify API error: ${res.status} on ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async searchTracks(query: string, limit = 20): Promise<SpotifyTrackObject[]> {
    const encoded = encodeURIComponent(query);
    const data = await this.fetchSpotify<{ tracks: { items: SpotifyTrackObject[] } }>(
      `/search?q=${encoded}&type=track&limit=${limit}`,
    );
    return data.tracks.items.filter((t) => Boolean(t.id));
  }

  async getPlaylistInfo(spotifyPlaylistId: string): Promise<SpotifyPlaylistObject> {
    return this.fetchSpotify<SpotifyPlaylistObject>(
      `/playlists/${spotifyPlaylistId}?fields=id,name,description,images,tracks`,
    );
  }

  async getPlaylistTracks(spotifyPlaylistId: string, offset = 0): Promise<SpotifyTrackObject[]> {
    const fields = "items(track(id,name,artists,album,preview_url,duration_ms,popularity))";
    const data = await this.fetchSpotify<{ items: { track: SpotifyTrackObject | null }[] }>(
      `/playlists/${spotifyPlaylistId}/tracks?offset=${offset}&limit=100&fields=${fields}`,
    );
    return data.items
      .map((i) => i.track)
      .filter((t): t is SpotifyTrackObject => t !== null && Boolean(t.id));
  }

  async importPlaylist(
    spotifyPlaylistId: string,
    options: ImportPlaylistOptions = {},
  ): Promise<Playlist> {
    const [info, allTracks] = await Promise.all([
      this.getPlaylistInfo(spotifyPlaylistId),
      this.getAllPlaylistTracks(spotifyPlaylistId),
    ]);

    // Upsert playlist
    const playlist = await Playlist.updateOrCreate(
      { spotifyId: options.playlistKey ?? spotifyPlaylistId },
      {
        name: info.name,
        description: info.description || null,
        coverUrl: info.images?.[0]?.url ?? null,
        trackCount: allTracks.length,
        createdBy: options.createdBy,
        visibility: options.visibility ?? "public",
        lastSyncedAt: DateTime.now(),
      },
    );

    // Upsert tracks
    const trackRecords: TrackCache[] = [];
    for (const chunk of this.chunks(allTracks, 10)) {
      const records = await Promise.all(
        chunk.map(async (t) => {
          const artist = t.artists.map((a) => a.name).join(", ");

          // Récupérer le track existant pour ne pas écraser un preview_url valide
          const existing = await TrackCache.findBy("spotifyId", t.id);
          const existingPreview = existing?.previewUrl ?? null;

          // Chercher un nouveau preview uniquement si nécessaire
          let previewUrl: string | null = existingPreview;
          if (!previewUrl) {
            previewUrl = t.preview_url ?? (await this.getDeezerPreview(t.name, artist));
          }

          return TrackCache.updateOrCreate(
            { spotifyId: t.id },
            {
              title: t.name,
              artist,
              album: t.album?.name ?? null,
              previewUrl,
              coverUrl: t.album?.images?.[0]?.url ?? null,
              durationMs: t.duration_ms,
              releaseYear: t.album?.release_date
                ? parseInt(t.album.release_date.substring(0, 4))
                : null,
              popularity: t.popularity,
              hasPreview: Boolean(previewUrl),
              metadata: t as unknown as Record<string, unknown>,
              cachedAt: DateTime.now(),
              expiresAt: DateTime.now().plus({ days: 7 }),
            },
          );
        }),
      );
      trackRecords.push(...records);
    }

    // Associer les tracks à la playlist via pivot
    await playlist.related("tracks").sync(
      trackRecords.reduce(
        (acc, t, i) => {
          acc[t.id] = { position: i + 1 };
          return acc;
        },
        {} as Record<number, { position: number }>,
      ),
    );

    // Mettre à jour le compte
    await playlist.merge({ trackCount: trackRecords.length }).save();

    return playlist;
  }

  private async getAllPlaylistTracks(spotifyPlaylistId: string): Promise<SpotifyTrackObject[]> {
    const tracks: SpotifyTrackObject[] = [];
    let offset = 0;

    while (true) {
      const batch = await this.getPlaylistTracks(spotifyPlaylistId, offset);
      tracks.push(...batch);
      if (batch.length < 100) break;
      offset += 100;
    }

    return tracks;
  }

  async getDeezerPreview(title: string, artist: string): Promise<string | null> {
    try {
      const q = encodeURIComponent(`artist:"${artist}" track:"${title}"`);
      const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=1&output=json`);
      if (!res.ok) return null;
      const data = (await res.json()) as { data?: { preview?: string }[] };
      return data.data?.[0]?.preview ?? null;
    } catch {
      return null;
    }
  }

  private *chunks<T>(arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) {
      yield arr.slice(i, i + size);
    }
  }

  buildSpotifyAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: env.get("SPOTIFY_CLIENT_ID") as string,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "user-read-private user-read-email",
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const clientId = env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = env.get("SPOTIFY_CLIENT_SECRET");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  async getSpotifyProfile(
    accessToken: string,
  ): Promise<{ id: string; display_name: string; images: { url: string }[] }> {
    const res = await fetch(`${this.BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json() as Promise<{ id: string; display_name: string; images: { url: string }[] }>;
  }
}
