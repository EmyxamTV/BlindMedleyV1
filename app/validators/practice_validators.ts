import vine from "@vinejs/vine";

export const previewQueryValidator = vine.create({
  trackId: vine.string().uuid(),
});

export const practiceQuestionQueryValidator = vine.create({
  playlistId: vine.string().uuid().optional(),
});
