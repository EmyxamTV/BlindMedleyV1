import { DateTime } from "luxon";
import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";
import User from "#models/user";
import TrackCache from "#models/track_cache";

export default class Playlist extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare spotifyId: string | null;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare coverUrl: string | null;

  @column()
  declare genre: string | null;

  @column()
  declare decade: string | null;

  @column()
  declare difficulty: number;

  @column()
  declare trackCount: number;

  @column()
  declare isActive: boolean;

  @column()
  declare isCurated: boolean;

  @column()
  declare createdBy: number | null;

  @column.dateTime()
  declare lastSyncedAt: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  @belongsTo(() => User, { foreignKey: "createdBy" })
  declare creator: BelongsTo<typeof User>;

  @manyToMany(() => TrackCache, {
    pivotTable: "playlist_tracks",
    localKey: "id",
    pivotForeignKey: "playlist_id",
    relatedKey: "id",
    pivotRelatedForeignKey: "track_id",
    pivotColumns: ["position"],
  })
  declare tracks: ManyToMany<typeof TrackCache>;
}
