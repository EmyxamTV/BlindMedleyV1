import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import Playlist from "#models/playlist";
import PlaylistShare from "#models/playlist_share";
import TrackCache from "#models/track_cache";
import User from "#models/user";
import Game from "#models/game";
import PlaylistTransformer from "#transformers/playlist_transformer";
import TrackCacheTransformer from "#transformers/track_cache_transformer";
import { DeezerService } from "#services/deezer_service";
import { PlaylistAccessService } from "#services/playlist_access_service";
import { PlaylistImportService } from "#services/playlist_import_service";
import { SpotifyService } from "#services/spotify_service";
import { sanitizeTrackText } from "#services/track_sanitizer";
import {
  addPlaylistTrackValidator,
  createManualPlaylistValidator,
  createPlaylistValidator,
  playlistsQueryValidator,
  removePlaylistTracksValidator,
  sharePlaylistValidator,
  trackSearchValidator,
  updatePlaylistValidator,
} from "#validators/playlist_validators";
import { DateTime } from "luxon";

type TrackSource = "deezer" | "spotify";

type TrackSearchResult = {
  source: TrackSource;
  sourceId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  durationMs: number | null;
  releaseYear: number | null;
  alreadyAdded: boolean;
};

@inject()
export default class PlaylistController {
  constructor(
    private readonly access: PlaylistAccessService,
    private readonly importer: PlaylistImportService,
    private readonly deezerService: DeezerService,
    private readonly spotifyService: SpotifyService,
  ) {}

  async index({ inertia, request, auth }: HttpContext) {
    const user = auth.user!;
    const {
      page = 1,
      search,
      filter = "all",
    } = await request.validateUsing(playlistsQueryValidator, { data: request.qs() });

    const query = this.access
      .forUser(Playlist.query(), user)
      .preload("shares", (q) => q.where("user_id", user.id))
      .orderBy("created_at", "desc");

    if (search) {
      query.where((q) => {
        q.where("name", "like", `%${search}%`).orWhere("description", "like", `%${search}%`);
      });
    }
    if (filter === "public") query.where("visibility", "public");
    if (filter === "mine") query.where("created_by", user.id);
    if (filter === "shared") {
      query.whereHas("shares", (q) => q.where("user_id", user.id));
    }

    const playlists = await query.paginate(page, 24);
    const rows = playlists.all().map((playlist) => this.withFlags(playlist, user));

    return inertia.render("playlists/index", {
      playlists: PlaylistTransformer.transform(rows),
      meta: playlists.getMeta(),
      search: search ?? "",
      filter,
    });
  }

  async create({ inertia }: HttpContext) {
    return inertia.render("playlists/create", {});
  }

  async play({ inertia, params, auth }: HttpContext) {
    const user = auth.user!;
    const playlist = await this.access
      .forUser(Playlist.query().where("id", params.id).where("is_active", true), user)
      .firstOrFail();

    this.withFlags(playlist, user);

    return inertia.render("game/wizard", {
      playlist: PlaylistTransformer.transform(playlist),
    });
  }

  async party({ inertia, params, auth }: HttpContext) {
    const user = auth.user!;
    const playlists = await this.access
      .forUser(Playlist.query().where("is_active", true), user)
      .orderBy("created_at", "desc")
      .preload("tracks", (query) => {
        query
          .where("has_preview", true)
          .whereNotNull("preview_url")
          .orderBy("playlist_tracks.position", "asc");
      });

    return inertia.render("playlists/party", {
      preselectedPlaylistId: params.id ?? null,
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        trackCount: playlist.trackCount,
        tracks: playlist.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverUrl: track.coverUrl,
          previewUrl: `/audio/preview?trackId=${track.id}`,
          playlistId: playlist.id,
          playlistName: playlist.name,
        })),
      })),
    });
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { url, name } = await request.validateUsing(createPlaylistValidator);
    const user = auth.user!;

    try {
      const result = await this.importer.importFromUrl(url, {
        userId: user.id,
        visibility: user.isAdmin ? "public" : "private",
      });
      if (name) await result.playlist.merge({ name }).save();
      session.flash("success", "Playlist importée");
      session.flash("playlistImport", {
        importedCount: result.playlist.trackCount,
        skippedCount: result.skippedCount,
      });
      return response.redirect().toRoute("playlists.edit", { id: result.playlist.id });
    } catch (error) {
      if ((error as Error).message === "INVALID_PLAYLIST_URL") {
        session.flash("error", "URL invalide: colle une URL Spotify ou Deezer");
        return response.redirect().back();
      }
      throw error;
    }
  }

  async storeManual({ request, auth, response, session }: HttpContext) {
    const { name } = await request.validateUsing(createManualPlaylistValidator);
    const user = auth.user!;

    const playlist = await Playlist.create({
      name,
      description: null,
      coverUrl: null,
      trackCount: 0,
      isActive: false,
      isCurated: false,
      createdBy: user.id,
      visibility: user.isAdmin ? "public" : "private",
      lastSyncedAt: DateTime.now(),
    });

    session.flash("success", "Playlist créée. Ajoute maintenant tes musiques.");
    return response.redirect().toRoute("playlists.edit", { id: playlist.id });
  }

  async edit({ inertia, params, request, auth }: HttpContext) {
    const user = auth.user!;
    const playlist = await Playlist.query()
      .where("id", params.id)
      .preload("shares", (q) => q.preload("user", (uq) => uq.preload("profile")))
      .firstOrFail();

    if (!(await this.access.canEdit(playlist, user))) {
      return inertia.render("errors/not_found", {});
    }

    this.withFlags(playlist, user, true);
    const trackPage = Math.max(1, Number(request.input("trackPage", 1)) || 1);
    const tracks = await playlist
      .related("tracks")
      .query()
      .orderBy("playlist_tracks.position", "asc")
      .paginate(trackPage, 100);

    return inertia.render("playlists/edit", {
      playlist: PlaylistTransformer.transform(playlist),
      tracks: tracks.all().map((track) => ({
        id: track.id,
        spotifyId: track.spotifyId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        previewUrl: track.previewUrl ? `/audio/preview?trackId=${track.id}` : null,
        coverUrl: track.coverUrl,
        durationMs: track.durationMs,
        releaseYear: track.releaseYear,
        genre: track.genre,
        popularity: track.popularity,
        hasPreview: track.hasPreview,
        metadata: track.metadata,
        cachedAt: track.cachedAt,
        expiresAt: track.expiresAt,
      })),
      tracksMeta: tracks.getMeta(),
      shares: playlist.shares.map((share) => ({
        id: share.id,
        userId: share.userId,
        canEdit: share.canEdit,
        username: share.user?.profile?.username ?? share.user?.fullName ?? share.user?.email,
        email: share.user?.email,
      })),
    });
  }

  async update({ params, request, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!(await this.access.canEdit(playlist, auth.user!))) {
      return response.notFound();
    }

    const payload = await request.validateUsing(updatePlaylistValidator);
    await playlist
      .merge({
        name: payload.name,
        description: payload.description || null,
        genre: payload.genre || null,
        decade: payload.decade || null,
      })
      .save();

    session.flash("success", "Playlist mise à jour");
    return response.redirect().back();
  }

  async searchTracks({ params, request, auth, response }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!(await this.access.canEdit(playlist, auth.user!))) return response.notFound();

    const { query } = await request.validateUsing(trackSearchValidator, { data: request.qs() });
    const [deezerTracks, spotifyTracks, playlistTracks] = await Promise.all([
      this.deezerService.searchTracks(query, 10).catch(() => []),
      this.spotifyService.searchTracks(query, 10).catch(() => []),
      playlist.related("tracks").query().select(["title", "artist"]),
    ]);

    const existingKeys = new Set(
      playlistTracks.map((track) => this.trackKey(track.title, track.artist)),
    );

    const results = [
      ...deezerTracks.map<TrackSearchResult>((track) => {
        const title = sanitizeTrackText(track.title);
        const artist = sanitizeTrackText(track.artist.name);
        return {
          source: "deezer",
          sourceId: String(track.id),
          title,
          artist,
          album: sanitizeTrackText(track.album.title ?? null),
          coverUrl: track.album.cover_medium ?? null,
          previewUrl: track.preview ?? null,
          durationMs: track.duration * 1000,
          releaseYear: track.album.release_date
            ? Number.parseInt(track.album.release_date.substring(0, 4))
            : null,
          alreadyAdded: existingKeys.has(this.trackKey(title, artist)),
        };
      }),
      ...(await Promise.all(
        spotifyTracks.map(async (track) => {
          const title = sanitizeTrackText(track.name);
          const artist = sanitizeTrackText(track.artists.map((item) => item.name).join(", "));
          const previewUrl =
            track.preview_url ?? (await this.spotifyService.getDeezerPreview(title, artist));
          return {
            source: "spotify" as const,
            sourceId: track.id,
            title,
            artist,
            album: sanitizeTrackText(track.album?.name ?? null),
            coverUrl: track.album?.images?.[0]?.url ?? null,
            previewUrl,
            durationMs: track.duration_ms,
            releaseYear: track.album?.release_date
              ? Number.parseInt(track.album.release_date.substring(0, 4))
              : null,
            alreadyAdded: existingKeys.has(this.trackKey(title, artist)),
          };
        }),
      )),
    ];

    return response.json({ results: this.dedupeTracks(results).slice(0, 10) });
  }

  async addTrack({ params, request, auth, response }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!(await this.access.canEdit(playlist, auth.user!))) return response.notFound();

    const payload = await request.validateUsing(addPlaylistTrackValidator);
    const title = sanitizeTrackText(payload.title);
    const artist = sanitizeTrackText(payload.artist);
    const album = sanitizeTrackText(payload.album ?? null);
    const key = this.trackKey(title, artist);
    const duplicate = (await playlist.related("tracks").query().select(["title", "artist"])).some(
      (track) => this.trackKey(track.title, track.artist) === key,
    );

    if (duplicate) {
      return response.status(409).json({ message: "Ce titre est déjà dans la playlist." });
    }

    const previewUrl = this.allowedPreviewUrl(payload.previewUrl ?? null);
    const track = await TrackCache.updateOrCreate(
      { spotifyId: payload.source === "deezer" ? `deezer:${payload.sourceId}` : payload.sourceId },
      {
        title,
        artist,
        album,
        previewUrl,
        coverUrl: payload.coverUrl ?? null,
        durationMs: payload.durationMs ?? null,
        releaseYear: payload.releaseYear ?? null,
        hasPreview: Boolean(previewUrl),
        metadata: JSON.stringify(payload),
        cachedAt: DateTime.now(),
        expiresAt: DateTime.now().plus({ days: 30 }),
      },
    );

    await playlist.related("tracks").attach({
      [track.id]: { position: playlist.trackCount + 1 },
    });
    await playlist.merge({ trackCount: playlist.trackCount + 1, isActive: true }).save();

    return response.json({ track: TrackCacheTransformer.transform(track) });
  }

  async removeTracks({ params, request, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!(await this.access.canEdit(playlist, auth.user!))) return response.notFound();

    const { trackIds } = await request.validateUsing(removePlaylistTracksValidator);
    await playlist.related("tracks").detach(trackIds);
    const [{ $extras }] = await playlist.related("tracks").query().count("* as total");
    await playlist.merge({ trackCount: Number($extras.total) }).save();

    session.flash("success", `${trackIds.length} titre(s) retiré(s)`);
    return response.redirect().back();
  }

  async destroy({ params, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!auth.user!.isAdmin && playlist.createdBy !== auth.user!.id) return response.notFound();

    await Game.query().where("playlist_id", playlist.id).update({ playlistId: null });
    await playlist.delete();

    session.flash("success", "Playlist supprimée");
    return response.redirect().toRoute("playlists.index");
  }

  async share({ params, request, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (playlist.visibility !== "private" || !(await this.access.canEdit(playlist, auth.user!))) {
      return response.notFound();
    }

    const payload = await request.validateUsing(sharePlaylistValidator);
    const users = [
      ...new Set(
        payload.user
          .split(/[,\s;]+/)
          .map((user) => user.trim())
          .filter(Boolean),
      ),
    ];
    let addedCount = 0;
    const missing: string[] = [];

    for (const user of users) {
      const target = await User.query()
        .where("email", user)
        .orWhereHas("profile", (q) => q.where("username", user))
        .first();

      if (!target || target.id === playlist.createdBy) {
        missing.push(user);
        continue;
      }

      await PlaylistShare.updateOrCreate(
        { playlistId: playlist.id, userId: target.id },
        { canEdit: Boolean(payload.canEdit) },
      );
      addedCount += 1;
    }

    if (addedCount === 0) {
      session.flash("error", "Aucun utilisateur trouvé");
      return response.redirect().back();
    }

    session.flash(
      "success",
      missing.length > 0
        ? `${addedCount} partage(s) mis à jour. Introuvable(s): ${missing.join(", ")}`
        : `${addedCount} partage(s) mis à jour`,
    );
    return response.redirect().back();
  }

  async unshare({ params, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (!(await this.access.canEdit(playlist, auth.user!))) return response.notFound();

    const share = await PlaylistShare.query()
      .where("id", params.shareId)
      .where("playlist_id", playlist.id)
      .firstOrFail();
    await share.delete();

    session.flash("success", "Partage retiré");
    return response.redirect().back();
  }

  private withFlags(playlist: Playlist, user: User, canEdit = false) {
    const shareCanEdit = playlist.shares?.some(
      (share) => share.userId === user.id && share.canEdit,
    );
    playlist.$extras.isOwner = playlist.createdBy === user.id;
    playlist.$extras.canEdit =
      canEdit || user.isAdmin || playlist.createdBy === user.id || shareCanEdit;
    return playlist;
  }

  private dedupeTracks(results: TrackSearchResult[]) {
    const byKey = new Map<string, TrackSearchResult>();
    for (const result of results) {
      const key = this.trackKey(result.title, result.artist);
      const existing = byKey.get(key);
      if (!existing || this.trackRank(result) > this.trackRank(existing)) byKey.set(key, result);
    }
    return [...byKey.values()];
  }

  private trackRank(track: TrackSearchResult) {
    return Number(Boolean(track.previewUrl)) * 2 + Number(track.source === "deezer");
  }

  private trackKey(title: string, artist: string) {
    return `${sanitizeTrackText(title)} ${sanitizeTrackText(artist)}`
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
      .trim();
  }

  private allowedPreviewUrl(url: string | null) {
    if (!url) return null;
    const parsed = new URL(url);
    const allowed = ["dzcdn.net", "scdn.co", "spotifycdn.com"];
    return parsed.protocol === "https:" &&
      allowed.some((domain) => parsed.hostname.endsWith(domain))
      ? url
      : null;
  }
}
