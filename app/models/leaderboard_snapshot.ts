import { belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { LeaderboardSnapshotSchema } from "#database/schema";
import User from "#models/user";

export default class LeaderboardSnapshot extends LeaderboardSnapshotSchema {
  static table = "leaderboard_snapshots";

  declare score: number;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;
}
