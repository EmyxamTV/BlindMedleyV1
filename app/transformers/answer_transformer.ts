import { BaseTransformer } from "@adonisjs/core/transformers";
import type Answer from "#models/answer";
import TrackCacheTransformer from "#transformers/track_cache_transformer";

export default class AnswerTransformer extends BaseTransformer<Answer> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "roundId",
        "gamePlayerId",
        "userId",
        "answerText",
        "answerTrackId",
        "isCorrect",
        "titleCorrect",
        "artistCorrect",
        "scoreEarned",
        "responseMs",
        "suspiciousFlags",
        "submittedAt",
      ]),
      answerTrack: TrackCacheTransformer.transform(this.whenLoaded(this.resource.answerTrack)),
    };
  }
}
