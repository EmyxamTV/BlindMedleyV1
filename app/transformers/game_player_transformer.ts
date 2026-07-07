import { BaseTransformer } from "@adonisjs/core/transformers";
import type GamePlayer from "#models/game_player";
import UserTransformer from "#transformers/user_transformer";
import { displayUsername } from "#services/display_name";

export default class GamePlayerTransformer extends BaseTransformer<GamePlayer> {
  constructor(
    resource: GamePlayer,
    private currentUserId?: string,
  ) {
    super(resource);
  }

  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "gameId",
        "userId",
        "score",
        "correct",
        "incorrect",
        "streak",
        "bestStreak",
        "rank",
        "xpEarned",
        "isConnected",
        "joinedAt",
        "leftAt",
      ]),
      username: displayUsername(
        this.resource.user?.profile?.username ?? this.resource.user?.fullName,
        `User${this.resource.userId}`,
      ),
      avatarUrl: this.resource.user?.profile?.avatarUrl ?? null,
      playlistName: this.resource.game?.playlist?.name ?? null,
      mode: this.resource.game?.mode,
      status: this.resource.game?.status,
      playedAt: this.resource.joinedAt,
      isMe: this.currentUserId === this.resource.userId,
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    };
  }
}
