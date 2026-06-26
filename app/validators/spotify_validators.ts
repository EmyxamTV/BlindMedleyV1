import vine from "@vinejs/vine";

export const spotifyCallbackValidator = vine.create({
  code: vine.string().optional(),
  error: vine.string().optional(),
});
