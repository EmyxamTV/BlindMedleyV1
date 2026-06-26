import { BaseTransformer } from "@adonisjs/core/transformers";
import type Playlist from "#models/playlist";

export default class PlaylistTransformer extends BaseTransformer<Playlist> {
  toObject() {
    return this.pick(this.resource, [
      "id",
      "spotifyId",
      "name",
      "description",
      "coverUrl",
      "genre",
      "decade",
      "difficulty",
      "trackCount",
      "isActive",
      "isCurated",
      "createdBy",
      "lastSyncedAt",
      "createdAt",
      "updatedAt",
    ]);
  }
}
