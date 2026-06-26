import { belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { AnswerSchema } from "#database/schema";
import Round from "#models/round";
import GamePlayer from "#models/game_player";
import User from "#models/user";
import TrackCache from "#models/track_cache";

export default class Answer extends AnswerSchema {
  @belongsTo(() => Round)
  declare round: BelongsTo<typeof Round>;

  @belongsTo(() => GamePlayer)
  declare gamePlayer: BelongsTo<typeof GamePlayer>;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;

  @belongsTo(() => TrackCache, { foreignKey: "answerTrackId" })
  declare answerTrack: BelongsTo<typeof TrackCache>;
}
