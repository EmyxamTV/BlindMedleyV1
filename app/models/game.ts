import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Playlist from '#models/playlist'
import GamePlayer from '#models/game_player'
import Round from '#models/round'

export type GameMode = 'solo' | 'public' | 'private' | 'matchmaking'
export type GameStatus = 'waiting' | 'starting' | 'active' | 'finished' | 'cancelled'
export type AnswerMode = 'choices' | 'text'
export type AnswerTarget = 'title' | 'artist' | 'both' | 'separate'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare publicId: string | null

  @column()
  declare code: string | null

  @column()
  declare mode: GameMode

  @column()
  declare answerMode: AnswerMode

  @column()
  declare answerTarget: AnswerTarget

  @column()
  declare status: GameStatus

  @column()
  declare playlistId: number | null

  @column()
  declare genreFilter: string | null

  @column()
  declare decadeFilter: string | null

  @column()
  declare difficulty: number

  @column()
  declare maxPlayers: number

  @column()
  declare roundCount: number

  @column()
  declare roundDurationMs: number

  @column()
  declare currentRound: number

  @column()
  declare hostId: number | null

  @column()
  declare winnerId: number | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'hostId' })
  declare host: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'winnerId' })
  declare winner: BelongsTo<typeof User>

  @belongsTo(() => Playlist)
  declare playlist: BelongsTo<typeof Playlist>

  @hasMany(() => GamePlayer)
  declare players: HasMany<typeof GamePlayer>

  @hasMany(() => Round)
  declare rounds: HasMany<typeof Round>
}
