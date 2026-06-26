import type { createGameValidator, submitAnswerValidator } from "#validators/game_validators";

export type CreateGamePayload = Awaited<ReturnType<typeof createGameValidator.validate>>;
export type SubmitAnswerPayload = Awaited<ReturnType<typeof submitAnswerValidator.validate>>;

export type CreateGameOptions = CreateGamePayload & {
  hostId: number;
  roundDurationMs?: number;
};

export type SubmitAnswerParams = SubmitAnswerPayload & {
  gameId: number;
  userId: number;
};
