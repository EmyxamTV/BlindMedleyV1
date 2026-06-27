import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import Playlist from "#models/playlist";
import PlaylistShare from "#models/playlist_share";
import User from "#models/user";
import PlaylistTransformer from "#transformers/playlist_transformer";
import TrackCacheTransformer from "#transformers/track_cache_transformer";
import { PlaylistAccessService } from "#services/playlist_access_service";
import { PlaylistImportService } from "#services/playlist_import_service";
import {
  createPlaylistValidator,
  playlistsQueryValidator,
  sharePlaylistValidator,
  updatePlaylistValidator,
} from "#validators/playlist_validators";

@inject()
export default class PlaylistController {
  constructor(
    private readonly access: PlaylistAccessService,
    private readonly importer: PlaylistImportService,
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

  async store({ request, auth, response, session }: HttpContext) {
    const { url } = await request.validateUsing(createPlaylistValidator);
    const user = auth.user!;

    try {
      const result = await this.importer.importFromUrl(url, {
        userId: user.id,
        visibility: user.isAdmin ? "public" : "private",
      });
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
      tracks: TrackCacheTransformer.transform(tracks.all()),
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
        difficulty: payload.difficulty,
      })
      .save();

    session.flash("success", "Playlist mise à jour");
    return response.redirect().back();
  }

  async share({ params, request, auth, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    if (playlist.visibility !== "private" || !(await this.access.canEdit(playlist, auth.user!))) {
      return response.notFound();
    }

    const payload = await request.validateUsing(sharePlaylistValidator);
    const target = await User.query()
      .where("email", payload.user)
      .orWhereHas("profile", (q) => q.where("username", payload.user))
      .first();

    if (!target || target.id === playlist.createdBy) {
      session.flash("error", "Utilisateur introuvable");
      return response.redirect().back();
    }

    await PlaylistShare.updateOrCreate(
      { playlistId: playlist.id, userId: target.id },
      { canEdit: Boolean(payload.canEdit) },
    );

    session.flash("success", "Partage mis à jour");
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
}
