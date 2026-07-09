import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import Playlist from "#models/playlist";
import TrackCache from "#models/track_cache";
import type User from "#models/user";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import { DeezerService } from "#services/deezer_service";
import { PlaylistAccessService } from "#services/playlist_access_service";
import TrackCacheTransformer from "#transformers/track_cache_transformer";
import {
  createAudioPreviewToken,
  resolveAudioPreviewToken,
} from "#services/audio_preview_token_service";
import {
  practiceQuestionQueryValidator,
  previewQueryValidator,
} from "#validators/practice_validators";

/** A short, no-lobby training mode inspired by the quick games in Blinest. */
@inject()
export default class PracticeController {
  constructor(
    private readonly deezerService: DeezerService,
    private readonly access: PlaylistAccessService,
  ) {}

  async index({ inertia, auth }: HttpContext) {
    return inertia.render("practice", {
      playlists: await this.practicePlaylists(auth.user!),
    });
  }

  async bandle({ inertia, auth }: HttpContext) {
    return inertia.render("bandle", {
      playlists: await this.practicePlaylists(auth.user!),
    });
  }

  async question({ request, response, serialize, auth }: HttpContext) {
    const { playlistId } = await request.validateUsing(practiceQuestionQueryValidator, {
      data: request.qs(),
    });

    if (playlistId && !(await this.access.canUse(playlistId, auth.user!))) {
      return response.forbidden({
        message: "Cette playlist n’est pas disponible.",
      });
    }

    const query = TrackCache.query()
      .where("has_preview", true)
      .whereNotNull("preview_url")
      .orderByRaw("RANDOM()")
      .limit(4);

    if (playlistId) {
      query.whereHas("playlists", (playlistQuery) => {
        playlistQuery.where("playlists.id", playlistId);
      });
    }

    const tracks = await query;

    if (tracks.length < 4) {
      return response.status(422).json({
        message: playlistId
          ? "Cette playlist doit contenir au moins 4 titres avec un extrait audio."
          : "Il faut au moins 4 titres avec un extrait audio pour lancer l’entraînement.",
      });
    }

    const correct = tracks[Math.floor(Math.random() * tracks.length)];
    const serializedTracks = await serialize.withoutWrapping(
      TrackCacheTransformer.transform(tracks),
    );
    const correctChoiceToken = this.generateChoiceToken();
    const choices = serializedTracks
      .map((track) => ({
        choiceToken: track.id === correct.id ? correctChoiceToken : this.generateChoiceToken(),
        title: track.title,
        artist: track.artist,
      }))
      .sort(() => Math.random() - 0.5);
    const previewToken = createAudioPreviewToken(correct.id);

    return response.json({
      correctChoiceToken,
      previewUrl: `/audio/preview?token=${previewToken}`,
      choices,
    });
  }

  async preview({ request, response }: HttpContext) {
    const { token } = await request.validateUsing(previewQueryValidator, { data: request.qs() });
    const trackId = resolveAudioPreviewToken(token);
    if (!trackId) return response.notFound("Preview not found");

    const track = await TrackCache.find(trackId);
    if (!track?.previewUrl) return response.notFound("Preview not found");

    let rawUrl = track.previewUrl;
    let url = new URL(rawUrl);

    const allowed = ["dzcdn.net", "scdn.co", "spotifycdn.com"];
    if (url.protocol !== "https:" || !allowed.some((domain) => url.hostname.endsWith(domain))) {
      return response.forbidden("Preview host not allowed");
    }

    let upstream = await fetch(url, { headers: { "User-Agent": "BlindMedley/1.0" } });
    if (!upstream.ok) {
      const refreshed = await this.deezerService.getPreview(track.title, track.artist);
      if (refreshed) {
        rawUrl = refreshed;
        url = new URL(rawUrl);
        await track.merge({ previewUrl: rawUrl, hasPreview: true }).save();
        upstream = await fetch(url, { headers: { "User-Agent": "BlindMedley/1.0" } });
      }
    }
    if (!upstream.ok || !upstream.body) return response.status(502).send("Preview unavailable");

    response.header("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");
    response.header("Cache-Control", "public, max-age=3600");
    return response.stream(
      Readable.fromWeb(upstream.body as unknown as Parameters<typeof Readable.fromWeb>[0]),
    );
  }

  private async practicePlaylists(user: User) {
    const playlists = await this.access
      .forUser(Playlist.query().where("is_active", true), user)
      .orderBy("name", "asc")
      .preload("tracks", (query) => {
        query.where("has_preview", true).whereNotNull("preview_url");
      });

    return playlists
      .map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist.tracks.length,
      }))
      .filter((playlist) => playlist.trackCount >= 4);
  }

  private generateChoiceToken(): string {
    return crypto.randomBytes(24).toString("base64url");
  }
}
