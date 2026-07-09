import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import Game from "#models/game";
import Playlist from "#models/playlist";
import TrackCache from "#models/track_cache";
import { PlaylistImportService } from "#services/playlist_import_service";
import { GameService } from "#services/game_service";
import { createAudioPreviewToken } from "#services/audio_preview_token_service";
import GameTransformer from "#transformers/game_transformer";
import UserTransformer from "#transformers/user_transformer";
import { DateTime } from "luxon";
import {
  adminUsersQueryValidator,
  banUserValidator,
  createOfficialGameValidator,
  importPlaylistValidator,
  suspendUserValidator,
  updateAdminGameValidator,
  updatePlaylistValidator,
  updatePlaylistTrackValidator,
} from "#validators/admin_validators";
import { inject } from "@adonisjs/core";

@inject()
export default class AdminController {
  constructor(
    private readonly playlistImportService: PlaylistImportService,
    private readonly gameService: GameService,
  ) {}

  async dashboard({ inertia }: HttpContext) {
    await this.gameService.syncOfficialGames();

    const [totalUsers, totalGames, activePlaylists, allGames] = await Promise.all([
      User.query().count("* as total"),
      Game.query().count("* as total"),
      Playlist.query().where("is_active", true).count("* as total"),
      Game.query()
        .orderBy("created_at", "desc")
        .preload("playlist")
        .preload("host", (query) => query.preload("profile"))
        .preload("players", (query) => query.where("is_connected", true)),
    ]);

    const recentGames = await Game.query()
      .whereIn("status", ["finished", "active"])
      .orderBy("created_at", "desc")
      .preload("playlist")
      .limit(5);

    const officialPlaylists = await Playlist.query()
      .where("is_active", true)
      .orderBy("name", "asc")
      .preload("tracks", (query) => {
        query
          .where("has_preview", true)
          .whereNotNull("preview_url")
          .orderBy("playlist_tracks.position", "asc");
      });

    return inertia.render("admin/dashboard", {
      stats: {
        totalUsers: Number(totalUsers[0].$extras.total),
        totalGames: Number(totalGames[0].$extras.total),
        activePlaylists: Number(activePlaylists[0].$extras.total),
      },
      recentGames: GameTransformer.transform(recentGames),
      allGames: GameTransformer.transform(allGames),
      officialPlaylists: officialPlaylists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks.length,
      })),
    });
  }

  async createOfficialGame({ request, auth, response, session }: HttpContext) {
    const payload = await request.validateUsing(createOfficialGameValidator);
    const playlist = await Playlist.query()
      .where("id", payload.playlistId)
      .where("is_active", true)
      .preload("tracks", (query) => {
        query.where("has_preview", true).whereNotNull("preview_url");
      })
      .firstOrFail();

    const roundCount = Number(payload.roundCount ?? 10);
    if (playlist.tracks.length < roundCount) {
      session.flash(
        "error",
        `Cette playlist n’a que ${playlist.tracks.length} extrait(s) jouable(s) pour ${roundCount} rounds.`,
      );
      return response.redirect().back();
    }

    await this.gameService.createGame({
      name: payload.name,
      mode: "public",
      source: "blindmedley",
      answerMode: payload.answerMode ?? "choices",
      answerTarget: payload.answerMode === "text" ? (payload.answerTarget ?? "both") : "both",
      playlistId: playlist.id,
      difficulty: Number(payload.difficulty ?? 2),
      maxPlayers: Number(payload.maxPlayers ?? 8),
      roundCount,
      hostId: auth.user!.id,
      addHost: false,
    });

    session.flash("success", "Partie officielle BlindMedley créée.");
    return response.redirect().toRoute("game.index");
  }

  async disableGame({ params, response, session }: HttpContext) {
    const game = await Game.findOrFail(params.id);

    if (game.status === "finished" || game.status === "cancelled") {
      session.flash("error", "Cette partie est déjà terminée ou désactivée.");
      return response.redirect().back();
    }

    await this.gameService.stopGame(game.id);
    session.flash("success", "Partie désactivée.");
    return response.redirect().back();
  }

  async updateGame({ params, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(updateAdminGameValidator);

    try {
      await this.gameService.updateAdminGame(params.id, {
        name: payload.name,
        answerMode: payload.answerMode,
        answerTarget: payload.answerMode === "choices" ? "both" : payload.answerTarget,
        difficulty: Number(payload.difficulty),
        maxPlayers: Number(payload.maxPlayers),
        roundCount: Number(payload.roundCount),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message === "GAME_ALREADY_STARTED"
          ? "Cette partie a déjà démarré : seuls les réglages non structurels peuvent être modifiés."
          : "Impossible de modifier cette partie.";
      session.flash("error", message);
      return response.redirect().back();
    }

    session.flash("success", "Partie modifiée.");
    return response.redirect().back();
  }

  async reactivateGame({ params, response, session }: HttpContext) {
    await this.gameService.reactivateGame(params.id);
    session.flash("success", "Partie réactivée.");
    return response.redirect().back();
  }

  async deleteGame({ params, response, session }: HttpContext) {
    await this.gameService.deleteGame(params.id);
    session.flash("success", "Partie supprimée.");
    return response.redirect().back();
  }

  async users({ inertia, request }: HttpContext) {
    const {
      page = 1,
      search,
      status,
    } = await request.validateUsing(adminUsersQueryValidator, {
      data: request.qs(),
    });

    const query = User.query().preload("profile").orderBy("created_at", "desc");

    if (search) {
      query.where((q) => {
        q.where("email", "like", `%${search}%`).orWhereHas("profile", (pq) =>
          pq.where("username", "like", `%${search}%`),
        );
      });
    }
    if (status) query.where("status", status);

    const users = await query.paginate(page, 20);

    return inertia.render("admin/users", {
      users: UserTransformer.transform(users.all()),
      meta: users.getMeta(),
      search: search ?? "",
      statusFilter: status ?? "",
    });
  }

  async banUser({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id);
    const { reason = "Violation des règles", duration } =
      await request.validateUsing(banUserValidator);

    await user
      .merge({
        status: "banned",
        banReason: reason,
        banExpiresAt: duration ? DateTime.now().plus({ hours: duration }) : null,
      })
      .save();

    session.flash("success", `${user.email} banni avec succès`);
    return response.redirect().back();
  }

  async suspendUser({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id);
    const { hours = 24 } = await request.validateUsing(suspendUserValidator);

    await user
      .merge({
        status: "suspended",
        banExpiresAt: DateTime.now().plus({ hours }),
      })
      .save();

    session.flash("success", `${user.email} suspendu pour ${hours}h`);
    return response.redirect().back();
  }

  async unbanUser({ params, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id);
    await user.merge({ status: "active", banReason: null, banExpiresAt: null }).save();
    session.flash("success", `${user.email} débanni`);
    return response.redirect().back();
  }

  async playlists({ inertia }: HttpContext) {
    const playlists = await Playlist.query()
      .orderBy("created_at", "desc")
      .preload("tracks", (query) => {
        query.orderBy("playlist_tracks.position", "asc").orderBy("tracks_cache.title", "asc");
      });

    return inertia.render("admin/playlists", {
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        spotifyId: playlist.spotifyId,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        genre: playlist.genre,
        decade: playlist.decade,
        trackCount: playlist.trackCount,
        isActive: playlist.isActive,
        isCurated: playlist.isCurated,
        visibility: playlist.visibility,
        createdBy: playlist.createdBy,
        lastSyncedAt: playlist.lastSyncedAt,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        tracks: playlist.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          coverUrl: track.coverUrl,
          previewUrl: track.previewUrl ? `/audio/preview?token=${createAudioPreviewToken(track.id)}` : null,
          hasPreview: track.hasPreview,
        })),
      })),
    });
  }

  async importPlaylist({ request, response, session }: HttpContext) {
    const { spotify_url: url, name } = await request.validateUsing(importPlaylistValidator);

    // Deezer : https://www.deezer.com/fr/playlist/1234567890
    const deezerMatch = url.match(/deezer\.com\/(?:[a-z]+\/)?playlist\/(\d+)/);
    if (deezerMatch) {
      const result = await this.playlistImportService.importFromUrl(url, { visibility: "public" });
      if (name) await result.playlist.merge({ name }).save();
      session.flash("success", "Playlist Deezer importée avec succès");
      return response.redirect().back();
    }

    // Spotify : https://open.spotify.com/playlist/xxxxx
    const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      const result = await this.playlistImportService.importFromUrl(url, { visibility: "public" });
      if (name) await result.playlist.merge({ name }).save();
      session.flash("success", "Playlist Spotify importée avec succès (previews Deezer)");
      return response.redirect().back();
    }

    session.flash("error", "URL invalide — colle une URL Spotify ou Deezer");
    return response.redirect().back();
  }

  async togglePlaylist({ params, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id);
    await playlist.merge({ isActive: !playlist.isActive }).save();
    session.flash("success", `Playlist ${playlist.isActive ? "activée" : "désactivée"}`);
    return response.redirect().back();
  }

  async updatePlaylist({ params, request, response, session }: HttpContext) {
    const { name, genre } = await request.validateUsing(updatePlaylistValidator);
    const playlist = await Playlist.findOrFail(params.id);

    await playlist
      .merge({
        name,
        genre: genre || null,
      })
      .save();

    session.flash("success", "Playlist modifiée avec succès");
    return response.redirect().back();
  }

  async updatePlaylistTrack({ params, request, response, session }: HttpContext) {
    const { title, artist } = await request.validateUsing(updatePlaylistTrackValidator);

    await Playlist.findOrFail(params.id);
    const track = await TrackCache.query()
      .where("id", params.trackId)
      .whereHas("playlists", (query) => {
        query.where("playlists.id", params.id);
      })
      .firstOrFail();

    await track.merge({ title, artist }).save();

    session.flash("success", "Morceau modifié avec succès");
    return response.redirect().back();
  }
}
