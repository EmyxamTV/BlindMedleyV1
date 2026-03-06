import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Playlist from '#models/playlist'

export default class TrackCache extends BaseModel {
  static table = 'tracks_cache'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare spotifyId: string

  @column()
  declare title: string

  @column()
  declare artist: string

  @column()
  declare album: string | null

  @column()
  declare previewUrl: string | null

  @column()
  declare coverUrl: string | null

  @column()
  declare durationMs: number | null

  @column()
  declare releaseYear: number | null

  @column()
  declare genre: string | null

  @column()
  declare popularity: number | null

  @column()
  declare hasPreview: boolean

  @column({
    prepare: (value: Record<string, unknown>) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value || '{}')
      } catch {
        return {}
      }
    },
  })
  declare metadata: Record<string, unknown>

  @column.dateTime()
  declare cachedAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime

  @manyToMany(() => Playlist, {
    pivotTable: 'playlist_tracks',
    localKey: 'id',
    pivotForeignKey: 'track_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'playlist_id',
  })
  declare playlists: ManyToMany<typeof Playlist>
}
