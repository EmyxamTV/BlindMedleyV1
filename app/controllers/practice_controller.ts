import type { HttpContext } from "@adonisjs/core/http";
import TrackCache from "#models/track_cache";
import { Readable } from "node:stream";
import deezerService from "#services/deezer_service";

/** A short, no-lobby training mode inspired by the quick games in Blinest. */
export default class PracticeController {
  async index({ inertia }: HttpContext) {
    return inertia.render("practice", {});
  }

  async bandle({ inertia }: HttpContext) {
    return inertia.render("bandle", {});
  }

  async question({ response }: HttpContext) {
    const tracks = await TrackCache.query()
      .where("has_preview", true)
      .whereNotNull("preview_url")
      .orderByRaw("RANDOM()")
      .limit(4);

    if (tracks.length < 4) {
      return response.status(422).json({
        message: "Il faut au moins 4 titres avec un extrait audio pour lancer l’entraînement.",
      });
    }

    const correct = tracks[Math.floor(Math.random() * tracks.length)];
    const choices = tracks
      .map((track) => ({ id: track.id, title: track.title, artist: track.artist }))
      .sort(() => Math.random() - 0.5);

    return response.json({
      correctTrackId: correct.id,
      previewUrl: `/audio/preview?trackId=${correct.id}`,
      choices,
    });
  }

  async preview({ request, response }: HttpContext) {
    const trackId = Number(request.input("trackId"));
    const track = Number.isInteger(trackId) ? await TrackCache.find(trackId) : null;
    if (!track?.previewUrl) return response.notFound("Preview not found");

    let rawUrl = track.previewUrl;
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return response.badRequest("Invalid preview URL");
    }

    const allowed = ["dzcdn.net", "scdn.co", "spotifycdn.com"];
    if (url.protocol !== "https:" || !allowed.some((domain) => url.hostname.endsWith(domain))) {
      return response.forbidden("Preview host not allowed");
    }

    let upstream = await fetch(url, { headers: { "User-Agent": "BlindMedley/1.0" } });
    if (!upstream.ok) {
      const refreshed = await deezerService.getPreview(track.title, track.artist);
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
    return response.stream(Readable.fromWeb(upstream.body as never));
  }
}
