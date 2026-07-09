import type { createGameValidator, submitAnswerValidator } from "#validators/game_validators";
import type { DateTime } from "luxon";

export type CreateGamePayload = Awaited<ReturnType<typeof createGameValidator.validate>>;
export type SubmitAnswerPayload = Awaited<ReturnType<typeof submitAnswerValidator.validate>>;

export type CreateGameOptions = Omit<CreateGamePayload, "playlistId" | "playlistIds" | "trackIds"> & {
  playlistId: string;
  hostId: string;
  source?: "player" | "blindmedley";
  addHost?: boolean;
  autoStartsAt?: DateTime | null;
  initialPlayerIds?: string[];
  roundDurationMs?: number;
};

export type SubmitAnswerParams = SubmitAnswerPayload & {
  gameId: string;
  userId: string;
};
