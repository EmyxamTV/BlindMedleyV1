import { BaseTransformer } from "@adonisjs/core/transformers";
import type TrackCache from "#models/track_cache";

export default class TrackCacheTransformer extends BaseTransformer<TrackCache> {
  toObject() {
    return this.pick(this.resource, [
      "id",
      "spotifyId",
      "title",
      "artist",
      "album",
      "previewUrl",
      "coverUrl",
      "durationMs",
      "releaseYear",
      "genre",
      "popularity",
      "hasPreview",
      "metadata",
      "cachedAt",
      "expiresAt",
    ]);
  }
}
