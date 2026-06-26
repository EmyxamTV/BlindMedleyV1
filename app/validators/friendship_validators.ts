import vine from "@vinejs/vine";

export const friendRequestParamsValidator = vine.create({
  userId: vine.number().positive(),
});

export const friendshipParamsValidator = vine.create({
  id: vine.number().positive(),
});
