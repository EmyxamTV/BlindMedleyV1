import vine from "@vinejs/vine";

export const adminUsersQueryValidator = vine.create({
  page: vine.number().min(1).optional(),
  search: vine.string().maxLength(100).optional(),
  status: vine.enum(["", "active", "suspended", "banned"]).optional(),
});

export const banUserValidator = vine.create({
  reason: vine.string().maxLength(500).optional(),
  duration: vine.number().positive().optional(),
});

export const suspendUserValidator = vine.create({
  hours: vine.number().positive().optional(),
});

export const importPlaylistValidator = vine.create({
  spotify_url: vine.string().trim().minLength(1).maxLength(500),
  name: vine.string().trim().maxLength(255).optional(),
});

export const updatePlaylistValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  genre: vine.string().trim().maxLength(100).optional(),
});

export const updatePlaylistTrackValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(500),
  artist: vine.string().trim().minLength(1).maxLength(500),
});
