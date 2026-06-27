import type { ModelQueryBuilderContract } from "@adonisjs/lucid/types/model";
import Playlist from "#models/playlist";
import type User from "#models/user";

type PlaylistQuery = ModelQueryBuilderContract<typeof Playlist, Playlist>;

export class PlaylistAccessService {
  forUser(query: PlaylistQuery, user: User) {
    if (user.isAdmin) return query;
    return query.where((q) => {
      q.where("visibility", "public")
        .where("is_active", true)
        .orWhere("created_by", user.id)
        .orWhereHas("shares", (sq) => sq.where("user_id", user.id));
    });
  }

  async canUse(playlistId: string, user: User) {
    if (user.isAdmin) return true;
    const playlist = await this.forUser(Playlist.query().where("id", playlistId), user).first();
    return Boolean(playlist);
  }

  async canEdit(playlist: Playlist, user: User) {
    if (user.isAdmin || playlist.createdBy === user.id) return true;
    const share = await playlist
      .related("shares")
      .query()
      .where("user_id", user.id)
      .where("can_edit", true)
      .first();
    return Boolean(share);
  }
}
