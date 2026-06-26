import vine from "@vinejs/vine";

export const createGameValidator = vine.create({
  mode: vine.enum(["solo", "public", "private"]),
  answerMode: vine.enum(["choices", "text"]).optional(),
  answerTarget: vine.enum(["title", "artist", "both", "separate"]).optional(),
  playlistId: vine.number().positive(),
  difficulty: vine.number().min(1).max(5).optional(),
  maxPlayers: vine.number().min(2).max(10).optional(),
  roundCount: vine.number().min(5).max(30).optional(),
});

export const submitAnswerValidator = vine.create({
  roundNumber: vine.number().positive(),
  answerTrackId: vine.number().positive().optional(),
  answerText: vine.string().maxLength(500).optional(),
});

export const joinGameValidator = vine.create({
  code: vine.string().maxLength(8).optional(),
});

export type CreateGamePayload = Awaited<ReturnType<typeof createGameValidator.validate>>;
export type SubmitAnswerPayload = Awaited<ReturnType<typeof submitAnswerValidator.validate>>;
