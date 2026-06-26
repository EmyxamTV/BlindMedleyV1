import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";
import User from "#models/user";

export default class Achievement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare key: string;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare icon: string | null;

  @column()
  declare color: string | null;

  @column()
  declare xpReward: number;

  @column({
    prepare: (value: Record<string, unknown>) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value || "{}");
      } catch {
        return {};
      }
    },
  })
  declare condition: Record<string, unknown>;

  @manyToMany(() => User, {
    pivotTable: "user_achievements",
    pivotColumns: ["unlocked_at"],
  })
  declare users: ManyToMany<typeof User>;
}
