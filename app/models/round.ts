import { belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import { RoundSchema } from "#database/schema";
import Game from "#models/game";
import TrackCache from "#models/track_cache";
import Answer from "#models/answer";

export default class Round extends RoundSchema {
  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>;

  @belongsTo(() => TrackCache, { foreignKey: "trackId" })
  declare track: BelongsTo<typeof TrackCache>;

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>;
}
