import { DateTime } from "luxon";
import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import User from "#models/user";
import Game from "#models/game";
import Answer from "#models/answer";

export default class GamePlayer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare gameId: number;

  @column()
  declare userId: number;

  @column()
  declare score: number;

  @column()
  declare correct: number;

  @column()
  declare incorrect: number;

  @column()
  declare streak: number;

  @column()
  declare bestStreak: number;

  @column()
  declare rank: number | null;

  @column()
  declare xpEarned: number;

  @column()
  declare isConnected: boolean;

  @column.dateTime()
  declare joinedAt: DateTime;

  @column.dateTime()
  declare leftAt: DateTime | null;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>;

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>;
}
