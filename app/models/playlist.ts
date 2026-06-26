import { belongsTo, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";
import { PlaylistSchema } from "#database/schema";
import User from "#models/user";
import TrackCache from "#models/track_cache";

export default class Playlist extends PlaylistSchema {
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
