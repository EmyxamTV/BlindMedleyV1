import type { createGameValidator, submitAnswerValidator } from "#validators/game_validators";

export type CreateGamePayload = Awaited<ReturnType<typeof createGameValidator.validate>>;
export type SubmitAnswerPayload = Awaited<ReturnType<typeof submitAnswerValidator.validate>>;

export type CreateGameOptions = Omit<CreateGamePayload, "playlistId" | "playlistIds" | "trackIds"> & {
  playlistId: string;
  hostId: string;
  roundDurationMs?: number;
};

export type SubmitAnswerParams = SubmitAnswerPayload & {
  gameId: string;
  userId: string;
};
