import { BaseTransformer } from "@adonisjs/core/transformers";
import type Profile from "#models/profile";
import { displayUsername } from "#services/display_name";

export default class ProfileTransformer extends BaseTransformer<Profile> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "userId",
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
      username: displayUsername(this.resource.username),
      accuracyRate: this.resource.accuracyRate,
    };
  }
}
