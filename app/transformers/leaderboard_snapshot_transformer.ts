import { BaseTransformer } from "@adonisjs/core/transformers";
import type LeaderboardSnapshot from "#models/leaderboard_snapshot";
import UserTransformer from "#transformers/user_transformer";
import { displayUsernameForUser } from "#services/display_name";

export default class LeaderboardSnapshotTransformer extends BaseTransformer<LeaderboardSnapshot> {
  constructor(
    resource: LeaderboardSnapshot,
    private rank?: number,
  ) {
    super(resource);
  }

  toObject() {
    return {
      ...this.pick(this.resource, ["id", "userId", "period", "country", "computedAt"]),
      rank: this.rank ?? this.resource.rank,
      score: Number(this.resource.score),
      username: displayUsernameForUser({
        username: this.resource.user?.profile?.username,
        fullName: this.resource.user?.fullName,
        fallback: `User${this.resource.userId}`,
      }),
      avatarUrl: this.resource.user?.profile?.avatarUrl ?? null,
      level: this.resource.user?.profile?.level ?? 1,
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    };
  }
}
