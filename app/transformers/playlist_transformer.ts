import { BaseTransformer } from "@adonisjs/core/transformers";
import type Playlist from "#models/playlist";

export default class PlaylistTransformer extends BaseTransformer<Playlist> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "spotifyId",
        "name",
        "description",
        "coverUrl",
        "genre",
        "decade",
        "trackCount",
        "isActive",
        "isCurated",
        "visibility",
        "createdBy",
        "lastSyncedAt",
        "createdAt",
        "updatedAt",
      ]),
      canEdit: Boolean(this.resource.$extras.canEdit),
      isOwner: Boolean(this.resource.$extras.isOwner),
    };
  }
}
