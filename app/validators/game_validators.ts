import vine from "@vinejs/vine";

export const createGameValidator = vine.create({
  name: vine.string().trim().maxLength(120).optional(),
  mode: vine.enum(["solo", "public", "private"]),
  answerMode: vine.enum(["choices", "text"]).optional(),
  answerTarget: vine.enum(["title", "artist", "both", "separate"]).optional(),
  playlistId: vine.string().uuid().optional(),
  playlistIds: vine.array(vine.string().uuid()).optional(),
  trackIds: vine.array(vine.string().uuid()).optional(),
  difficulty: vine.number().min(1).max(5).optional(),
  maxPlayers: vine.number().min(2).max(10).optional(),
  roundCount: vine.number().min(5).max(30).optional(),
});

export const gameTrackSearchValidator = vine.create({
  query: vine.string().trim().minLength(2).maxLength(100),
});

export const submitAnswerValidator = vine.create({
  roundNumber: vine.number().positive(),
  answerTrackId: vine.string().uuid().optional(),
  answerText: vine.string().maxLength(500).optional(),
});

export const joinGameValidator = vine.create({
  code: vine.string().maxLength(8).optional(),
});
