import { BaseTransformer } from "@adonisjs/core/transformers";
import type Game from "#models/game";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import PlaylistTransformer from "#transformers/playlist_transformer";
import UserTransformer from "#transformers/user_transformer";
import { displayUsername } from "#services/display_name";

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
        "status",
        "playlistId",
        "genreFilter",
        "decadeFilter",
        "difficulty",
        "maxPlayers",
        "roundCount",
        "roundDurationMs",
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
      playlistName: this.resource.playlist?.name ?? "?",
      hostUsername: displayUsername(
        this.resource.host?.profile?.username ?? this.resource.host?.fullName,
        "Hôte",
      ),
      playerCount: this.resource.players?.length ?? 0,
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
