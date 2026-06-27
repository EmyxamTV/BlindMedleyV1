import { belongsTo, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import { PlaylistSchema } from "#database/schema";
import User from "#models/user";
import TrackCache from "#models/track_cache";
import PlaylistShare from "#models/playlist_share";

export default class Playlist extends PlaylistSchema {
  declare visibility: "public" | "private";

  @belongsTo(() => User, { foreignKey: "createdBy" })
  declare creator: BelongsTo<typeof User>;

  @hasMany(() => PlaylistShare)
  declare shares: HasMany<typeof PlaylistShare>;

  @manyToMany(() => TrackCache, {
    pivotTable: "playlist_tracks",
    pivotForeignKey: "playlist_id",
    pivotRelatedForeignKey: "track_id",
    pivotColumns: ["position"],
  })
  declare tracks: ManyToMany<typeof TrackCache>;
}
