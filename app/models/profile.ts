import { DateTime } from "luxon";
import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import User from "#models/user";

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number;

  @column()
  declare username: string;

  @column()
  declare avatarUrl: string | null;

  @column()
  declare country: string | null;

  @column()
  declare bio: string | null;

  @column()
  declare level: number;

  @column()
  declare xp: number;

  @column()
  declare xpToNextLevel: number;

  @column()
  declare totalGames: number;

  @column()
  declare totalWins: number;

  @column()
  declare totalCorrect: number;

  @column()
  declare totalAnswers: number;

  @column()
  declare avgScore: number;

  @column()
  declare avgResponseMs: number;

  @column()
  declare bestStreak: number;

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value || "[]");
      } catch {
        return [];
      }
    },
  })
  declare favoriteGenres: string[];

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  get accuracyRate(): number {
    if (this.totalAnswers === 0) return 0;
    return Math.round((this.totalCorrect / this.totalAnswers) * 100);
  }
}
