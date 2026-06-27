import { manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";
import { TracksCacheSchema } from "#database/schema";
import Playlist from "#models/playlist";

export default class TrackCache extends TracksCacheSchema {
  static table = "tracks_cache";

  @manyToMany(() => Playlist, {
    pivotTable: "playlist_tracks",
    pivotForeignKey: "track_id",
    pivotRelatedForeignKey: "playlist_id",
  })
  declare playlists: ManyToMany<typeof Playlist>;
}
