import vine from "@vinejs/vine";

export const updateProfileValidator = vine.create({
  username: vine
    .string()
    .minLength(3)
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  bio: vine.string().maxLength(300).optional(),
  country: vine.string().fixedLength(2).optional(),
  avatarUrl: vine.string().url().optional(),
});
