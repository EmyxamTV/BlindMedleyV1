import vine from "@vinejs/vine";

export const friendRequestParamsValidator = vine.create({
  userId: vine.string().uuid(),
});

export const friendshipParamsValidator = vine.create({
  id: vine.string().uuid(),
});
