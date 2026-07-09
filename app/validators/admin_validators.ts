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

export const createOfficialGameValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  playlistId: vine.string().uuid(),
  answerMode: vine.enum(["choices", "text"]).optional(),
  answerTarget: vine.enum(["title", "artist", "both", "separate"]).optional(),
  difficulty: vine.enum(["1", "2", "3", "4", "5"]).optional(),
  maxPlayers: vine.enum(["2", "4", "6", "8", "10", "12", "16", "20", "30", "50"]).optional(),
  roundCount: vine.enum(["5", "10", "15", "20", "30"]).optional(),
});

export const updateAdminGameValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  answerMode: vine.enum(["choices", "text"]),
  answerTarget: vine.enum(["title", "artist", "both", "separate"]),
  difficulty: vine.enum(["1", "2", "3", "4", "5"]),
  maxPlayers: vine.enum(["2", "4", "6", "8", "10", "12", "16", "20", "30", "50"]),
  roundCount: vine.enum(["5", "10", "15", "20", "30"]),
});
