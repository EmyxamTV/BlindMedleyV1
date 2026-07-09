import { BaseTransformer } from "@adonisjs/core/transformers";
import type Game from "#models/game";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import PlaylistTransformer from "#transformers/playlist_transformer";
import UserTransformer from "#transformers/user_transformer";
import { displayUsernameForUser } from "#services/display_name";

export default class GameTransformer extends BaseTransformer<Game> {
  constructor(
    resource: Game,
    private currentUserId?: string,
  ) {
    super(resource);
  }

  toObject() {
    return {
      ...this.pick(this.resource, [
        "code",
        "name",
        "pausedAt",
        "mode",
        "answerMode",
        "answerTarget",
        "autoStartsAt",
        "status",
        "playlistId",
        "genreFilter",
        "decadeFilter",
        "difficulty",
        "maxPlayers",
        "roundCount",
        "roundDurationMs",
        "source",
        "currentRound",
        "hostId",
        "winnerId",
        "startedAt",
        "finishedAt",
        "createdAt",
        "updatedAt",
      ]),
      id: this.resource.publicId ?? String(this.resource.id),
      numericId: this.resource.id,
      publicId: this.resource.publicId,
      isOfficial: this.resource.source === "blindmedley",
      playlistName: this.resource.playlist?.name ?? "?",
      hostUsername: displayUsernameForUser({
        username: this.resource.host?.profile?.username,
        fullName: this.resource.host?.fullName,
        fallback: "Hôte",
      }),
      playerCount:
        this.resource.players?.filter(
          (player) =>
            player.isConnected &&
            !(this.resource.source === "blindmedley" && player.userId === this.resource.hostId),
        ).length ?? 0,
      host: UserTransformer.transform(this.whenLoaded(this.resource.host)),
      winner: UserTransformer.transform(this.whenLoaded(this.resource.winner)),
      playlist: PlaylistTransformer.transform(this.whenLoaded(this.resource.playlist)),
      players: GamePlayerTransformer.transform(
        this.whenLoaded(this.resource.players),
        this.currentUserId,
      ),
    };
  }
}
