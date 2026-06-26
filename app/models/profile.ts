import { belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { ProfileSchema } from "#database/schema";
import User from "#models/user";

export default class Profile extends ProfileSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  get accuracyRate(): number {
    if (this.totalAnswers === 0) return 0;
    return Math.round((this.totalCorrect / this.totalAnswers) * 100);
  }
}
