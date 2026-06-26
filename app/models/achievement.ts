import { manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";
import { AchievementSchema } from "#database/schema";
import User from "#models/user";

export default class Achievement extends AchievementSchema {
  @manyToMany(() => User, {
    pivotTable: "user_achievements",
    pivotColumns: ["unlocked_at"],
  })
  declare users: ManyToMany<typeof User>;
}
