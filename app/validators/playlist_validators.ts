import vine from "@vinejs/vine";

export const playlistsQueryValidator = vine.create({
  page: vine.number().min(1).optional(),
  search: vine.string().trim().maxLength(100).optional(),
  filter: vine.enum(["all", "public", "mine", "shared"]).optional(),
});

export const createPlaylistValidator = vine.create({
  url: vine.string().trim().minLength(1).maxLength(500),
});

export const updatePlaylistValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().maxLength(1000).optional(),
  genre: vine.string().trim().maxLength(100).optional(),
  decade: vine.string().trim().maxLength(6).optional(),
  difficulty: vine.number().min(1).max(5),
});

export const sharePlaylistValidator = vine.create({
  user: vine.string().trim().minLength(1).maxLength(254),
  canEdit: vine.boolean().optional(),
});
