import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Round from '#models/round'
import GamePlayer from '#models/game_player'
import User from '#models/user'
import TrackCache from '#models/track_cache'

export default class Answer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roundId: number

  @column()
  declare gamePlayerId: number

  @column()
  declare userId: number

  @column()
  declare answerText: string | null

  @column()
  declare answerTrackId: number | null

  @column()
  declare isCorrect: boolean

  @column()
  declare titleCorrect: boolean

  @column()
  declare artistCorrect: boolean

  @column()
  declare scoreEarned: number

  @column()
  declare responseMs: number

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value || '[]')
      } catch {
        return []
      }
    },
  })
  declare suspiciousFlags: string[]

  @column.dateTime()
  declare submittedAt: DateTime

  @belongsTo(() => Round)
  declare round: BelongsTo<typeof Round>

  @belongsTo(() => GamePlayer)
  declare gamePlayer: BelongsTo<typeof GamePlayer>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => TrackCache, { foreignKey: 'answerTrackId' })
  declare answerTrack: BelongsTo<typeof TrackCache>
}
