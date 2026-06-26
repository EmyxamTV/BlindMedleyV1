import { DateTime } from "luxon";
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import User from "#models/user";

export default class LeaderboardSnapshot extends BaseModel {
  static table = "leaderboard_snapshots";

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare period: string; // global | weekly:YYYY-WW | monthly:YYYY-MM

  @column()
  declare score: number;

  @column()
  declare rank: number | null;

  @column()
  declare country: string | null;

  @column.dateTime()
  declare computedAt: DateTime;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;
}
