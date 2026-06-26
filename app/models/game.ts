import { belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import { GameSchema } from "#database/schema";
import User from "#models/user";
import Playlist from "#models/playlist";
import GamePlayer from "#models/game_player";
import Round from "#models/round";

export type GameMode = "solo" | "public" | "private" | "matchmaking";
export type GameStatus = "waiting" | "starting" | "active" | "finished" | "cancelled";
export type AnswerMode = "choices" | "text";
export type AnswerTarget = "title" | "artist" | "both" | "separate";

export default class Game extends GameSchema {
  declare mode: GameMode;

  declare answerMode: AnswerMode;

  declare answerTarget: AnswerTarget;

  declare status: GameStatus;

  @belongsTo(() => User, { foreignKey: "hostId" })
  declare host: BelongsTo<typeof User>;

  @belongsTo(() => User, { foreignKey: "winnerId" })
  declare winner: BelongsTo<typeof User>;

  @belongsTo(() => Playlist)
  declare playlist: BelongsTo<typeof Playlist>;

  @hasMany(() => GamePlayer)
  declare players: HasMany<typeof GamePlayer>;

  @hasMany(() => Round)
  declare rounds: HasMany<typeof Round>;
}
