import vine from "@vinejs/vine";

export const previewQueryValidator = vine.create({
  trackId: vine.number().positive(),
});
