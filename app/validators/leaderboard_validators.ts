import vine from "@vinejs/vine";

export const leaderboardQueryValidator = vine.create({
  period: vine.enum(["global", "weekly", "monthly"]).optional(),
  country: vine.string().fixedLength(2).optional(),
  search: vine.string().maxLength(50).optional(),
});
