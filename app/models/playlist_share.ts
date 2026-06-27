import { belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { PlaylistShareSchema } from "#database/schema";
import Playlist from "#models/playlist";
import User from "#models/user";

export default class PlaylistShare extends PlaylistShareSchema {
  @belongsTo(() => Playlist)
  declare playlist: BelongsTo<typeof Playlist>;

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>;
}
