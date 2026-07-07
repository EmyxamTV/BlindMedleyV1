import vine from "@vinejs/vine";

export const updateProfileValidator = vine.create({
  fullName: vine.string().trim().maxLength(100).nullable().optional(),
  username: vine
    .string()
    .trim()
    .minLength(3)
    .maxLength(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  email: vine.string().trim().email().maxLength(254).optional(),
  currentPassword: vine.string().trim().maxLength(100).optional(),
  bio: vine.string().maxLength(300).optional(),
  country: vine.string().fixedLength(2).optional(),
  avatarUrl: vine.string().trim().maxLength(1000).nullable().optional(),
});

export const updatePasswordValidator = vine.create({
  currentPassword: vine.string().minLength(1).maxLength(100),
  password: vine.string().minLength(8).maxLength(32).confirmed({
    confirmationField: "passwordConfirmation",
  }),
});
