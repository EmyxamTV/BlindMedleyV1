import { belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import { GamePlayerSchema } from "#database/schema";
import User from "#models/user";
import Game from "#models/game";
import Answer from "#models/answer";

export default class GamePlayer extends GamePlayerSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>;

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>;
}
