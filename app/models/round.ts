import { DateTime } from "luxon";
import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import Game from "#models/game";
import TrackCache from "#models/track_cache";
import Answer from "#models/answer";

export default class Round extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare gameId: number;

  @column()
  declare trackId: number;

  @column()
  declare roundNumber: number;

  @column()
  declare roundToken: string;

  @column({
    prepare: (value: number[]) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value || "[]");
      } catch {
        return [];
      }
    },
  })
  declare distractors: number[]; // IDs de tracks (faux choix)

  @column.dateTime()
  declare startsAt: DateTime | null;

  @column.dateTime()
  declare endsAt: DateTime | null;

  @column.dateTime()
  declare revealedAt: DateTime | null;

  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>;

  @belongsTo(() => TrackCache, { foreignKey: "trackId" })
  declare track: BelongsTo<typeof TrackCache>;

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>;
}
