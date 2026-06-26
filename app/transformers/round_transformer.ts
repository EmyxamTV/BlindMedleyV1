import { BaseTransformer } from "@adonisjs/core/transformers";
import type Round from "#models/round";
import TrackCacheTransformer from "#transformers/track_cache_transformer";

export default class RoundTransformer extends BaseTransformer<Round> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "gameId",
        "trackId",
        "roundNumber",
        "startsAt",
        "endsAt",
        "revealedAt",
      ]),
      track: TrackCacheTransformer.transform(this.whenLoaded(this.resource.track)),
    };
  }
}
