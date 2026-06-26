import TrackCache from "#models/track_cache";
import Playlist from "#models/playlist";
import { DateTime } from "luxon";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string; // URL MP3 30s — toujours disponible sur Deezer
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_medium: string; release_date: string };
}

interface DeezerPlaylist {
  id: number;
  title: string;
  description: string;
  picture_medium: string;
  nb_tracks: number;
  tracks: { data: DeezerTrack[] };
}

export class DeezerService {
  private readonly BASE = "https://api.deezer.com";

  private async fetch<T>(path: string): Promise<T> {
    const res = await globalThis.fetch(`${this.BASE}${path}`);
    if (!res.ok) throw new Error(`Deezer API error: ${res.status} on ${path}`);
    return res.json() as Promise<T>;
  }

  /** Importe une playlist Deezer complète (toutes pages) */
  async importPlaylist(deezerPlaylistId: string): Promise<Playlist> {
    const info = await this.fetch<DeezerPlaylist>(`/playlist/${deezerPlaylistId}`);

    // Récupérer toutes les tracks (pagination 25 par défaut)
    const allTracks = await this.getAllTracks(deezerPlaylistId, info.nb_tracks);

    // Upsert playlist
    const playlist = await Playlist.updateOrCreate(
      { spotifyId: `deezer:${deezerPlaylistId}` },
      {
        name: info.title,
        description: info.description || null,
        coverUrl: info.picture_medium ?? null,
        trackCount: allTracks.length,
        isActive: true,
        lastSyncedAt: DateTime.now(),
      },
    );

    // Upsert tracks par lots de 10
    const trackRecords: TrackCache[] = [];
    for (const chunk of this.chunks(allTracks, 10)) {
      const records = await Promise.all(
        chunk.map((t) =>
          TrackCache.updateOrCreate(
            { spotifyId: `deezer:${t.id}` },
            {
              title: t.title,
              artist: t.artist.name,
              album: t.album.title,
              previewUrl: t.preview || null,
              coverUrl: t.album.cover_medium || null,
              durationMs: t.duration * 1000,
              releaseYear: t.album.release_date
                ? parseInt(t.album.release_date.substring(0, 4))
                : null,
              popularity: null,
              hasPreview: Boolean(t.preview),
              metadata: t as unknown as Record<string, unknown>,
              cachedAt: DateTime.now(),
              expiresAt: DateTime.now().plus({ days: 30 }),
            },
          ),
        ),
      );
      trackRecords.push(...records);
    }

    // Lier les tracks à la playlist
    await playlist.related("tracks").sync(
      trackRecords.reduce(
        (acc, t, i) => {
          acc[t.id] = { position: i + 1 };
          return acc;
        },
        {} as Record<number, { position: number }>,
      ),
    );

    await playlist.merge({ trackCount: trackRecords.length }).save();
    return playlist;
  }

  /**
   * Create the built-in starter playlist used by a new installation.
   * Deezer's public chart provides previews, so a lobby is playable immediately.
   */
  async importStarterPlaylist(): Promise<Playlist> {
    const chart = await this.fetch<{ tracks: { data: DeezerTrack[] } }>("/chart/0?limit=100");
    const tracks = chart.tracks.data.filter((track) => Boolean(track.preview));

    if (tracks.length < 5) {
      throw new Error(
        "La selection Deezer ne contient pas assez de titres jouables. Reessayez dans un instant.",
      );
    }

    const playlist = await Playlist.updateOrCreate(
      { spotifyId: "deezer:starter-chart" },
      {
        name: "Hits du moment",
        description: "Selection publique Deezer mise a jour automatiquement.",
        coverUrl: tracks[0]?.album.cover_medium ?? null,
        trackCount: tracks.length,
        isActive: true,
        genre: "Pop",
        difficulty: 2,
        lastSyncedAt: DateTime.now(),
      },
    );

    const records: TrackCache[] = [];
    for (const chunk of this.chunks(tracks, 10)) {
      const batch = await Promise.all(
        chunk.map((track) =>
          TrackCache.updateOrCreate(
            { spotifyId: `deezer:${track.id}` },
            {
              title: track.title,
              artist: track.artist.name,
              album: track.album.title,
              previewUrl: track.preview,
              coverUrl: track.album.cover_medium ?? null,
              durationMs: track.duration * 1000,
              releaseYear: track.album.release_date
                ? Number.parseInt(track.album.release_date.substring(0, 4))
                : null,
              hasPreview: true,
              metadata: track as unknown as Record<string, unknown>,
              cachedAt: DateTime.now(),
              expiresAt: DateTime.now().plus({ days: 30 }),
            },
          ),
        ),
      );
      records.push(...batch);
    }

    await playlist.related("tracks").sync(
      records.reduce(
        (acc, track, index) => {
          acc[track.id] = { position: index + 1 };
          return acc;
        },
        {} as Record<number, { position: number }>,
      ),
    );

    return playlist.merge({ trackCount: records.length, isActive: true }).save();
  }

  /** Recherche une preview Deezer pour un titre+artiste (utilisé comme fallback Spotify) */
  async getPreview(title: string, artist: string): Promise<string | null> {
    try {
      const q = encodeURIComponent(`${title} ${artist}`);
      const data = await this.fetch<{ data?: { preview?: string }[] }>(`/search?q=${q}&limit=1`);
      return data.data?.[0]?.preview ?? null;
    } catch {
      return null;
    }
  }

  private async getAllTracks(playlistId: string, total: number): Promise<DeezerTrack[]> {
    const tracks: DeezerTrack[] = [];
    let index = 0;
    const limit = 100;

    while (index < total) {
      const page = await this.fetch<{ data: DeezerTrack[] }>(
        `/playlist/${playlistId}/tracks?index=${index}&limit=${limit}`,
      );
      tracks.push(...page.data);
      if (page.data.length < limit) break;
      index += limit;
    }

    return tracks.filter((t) => Boolean(t.preview));
  }

  private *chunks<T>(arr: T[], size: number): Generator<T[]> {
    for (let i = 0; i < arr.length; i += size) {
      yield arr.slice(i, i + size);
    }
  }
}

export default new DeezerService();
