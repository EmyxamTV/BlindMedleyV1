import { BaseTransformer } from "@adonisjs/core/transformers";
import type Profile from "#models/profile";

export default class ProfileTransformer extends BaseTransformer<Profile> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "userId",
        "username",
        "avatarUrl",
        "country",
        "bio",
        "level",
        "xp",
        "xpToNextLevel",
        "totalGames",
        "totalWins",
        "totalCorrect",
        "totalAnswers",
        "avgScore",
        "avgResponseMs",
        "bestStreak",
        "favoriteGenres",
        "createdAt",
        "updatedAt",
      ]),
      accuracyRate: this.resource.accuracyRate,
    };
  }
}
