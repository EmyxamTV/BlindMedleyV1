import type { HttpContext } from "@adonisjs/core/http";
import User from "#models/user";
import Game from "#models/game";
import Playlist from "#models/playlist";
import { SpotifyService } from "#services/spotify_service";
import { DeezerService } from "#services/deezer_service";
import GameTransformer from "#transformers/game_transformer";
import PlaylistTransformer from "#transformers/playlist_transformer";
import UserTransformer from "#transformers/user_transformer";
import { DateTime } from "luxon";
import {
  adminUsersQueryValidator,
  banUserValidator,
  importPlaylistValidator,
  suspendUserValidator,
} from "#validators/admin_validators";
import { inject } from "@adonisjs/core";

@inject()
export default class AdminController {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly deezerService: DeezerService,
  ) {}

  async dashboard({ inertia }: HttpContext) {
    const [totalUsers, totalGames, activePlaylists] = await Promise.all([
      User.query().count("* as total"),
      Game.query().count("* as total"),
      Playlist.query().where("is_active", true).count("* as total"),
    ]);

    const recentGames = await Game.query()
      .whereIn("status", ["finished", "active"])
      .orderBy("created_at", "desc")
      .preload("playlist")
      .limit(5);

    return inertia.render("admin/dashboard", {
      stats: {
        totalUsers: Number(totalUsers[0].$extras.total),
        totalGames: Number(totalGames[0].$extras.total),
        activePlaylists: Number(activePlaylists[0].$extras.total),
      },
      recentGames: GameTransformer.transform(recentGames),
    });
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
    const playlists = await Playlist.query().orderBy("created_at", "desc");
    return inertia.render("admin/playlists", {
      playlists: PlaylistTransformer.transform(playlists),
    });
  }

  async importPlaylist({ request, response, session }: HttpContext) {
    const { spotify_url: url } = await request.validateUsing(importPlaylistValidator);

    // Deezer : https://www.deezer.com/fr/playlist/1234567890
    const deezerMatch = url.match(/deezer\.com\/(?:[a-z]+\/)?playlist\/(\d+)/);
    if (deezerMatch) {
      await this.deezerService.importPlaylist(deezerMatch[1]);
      session.flash("success", "Playlist Deezer importée avec succès");
      return response.redirect().back();
    }

    // Spotify : https://open.spotify.com/playlist/xxxxx
    const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      await this.spotifyService.importPlaylist(spotifyMatch[1]);
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
}
