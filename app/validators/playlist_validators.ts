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
});

export const sharePlaylistValidator = vine.create({
  user: vine.string().trim().minLength(1).maxLength(2000),
  canEdit: vine.boolean().optional(),
});

export const trackSearchValidator = vine.create({
  query: vine.string().trim().minLength(2).maxLength(100),
});

export const addPlaylistTrackValidator = vine.create({
  source: vine.enum(["deezer", "spotify"]),
  sourceId: vine.string().trim().minLength(1).maxLength(100),
  title: vine.string().trim().minLength(1).maxLength(500),
  artist: vine.string().trim().minLength(1).maxLength(500),
  album: vine.string().trim().maxLength(500).nullable().optional(),
  coverUrl: vine.string().trim().url().maxLength(1000).nullable().optional(),
  previewUrl: vine.string().trim().url().maxLength(1000).nullable().optional(),
  durationMs: vine.number().min(0).nullable().optional(),
  releaseYear: vine.number().min(1800).max(2200).nullable().optional(),
});

export const removePlaylistTracksValidator = vine.create({
  trackIds: vine.array(vine.string().uuid()).minLength(1),
});
