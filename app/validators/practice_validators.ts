import vine from "@vinejs/vine";

export const previewQueryValidator = vine.create({
  token: vine.string().trim().minLength(20).maxLength(120),
});

export const practiceQuestionQueryValidator = vine.create({
  playlistId: vine.string().uuid().optional(),
});
