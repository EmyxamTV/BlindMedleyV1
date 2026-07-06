import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const NewAccountController = () => import("#controllers/new_account_controller");
const SessionController = () => import("#controllers/session_controller");
const SpotifyOAuthController = () => import("#controllers/spotify_oauth_controller");
const ProfileController = () => import("#controllers/profile_controller");
const GameController = () => import("#controllers/game_controller");
const PlaylistController = () => import("#controllers/playlist_controller");
const LeaderboardController = () => import("#controllers/leaderboard_controller");
const PracticeController = () => import("#controllers/practice_controller");
const FriendshipController = () => import("#controllers/friendship_controller");
const AdminController = () => import("#controllers/admin/admin_controller");

// ─── Home ─────────────────────────────────────────────────────────────────────
router.on("/").renderInertia("home", {}).as("home");
router.on("/politique-confidentialite").renderInertia("privacy_policy", {}).as("privacy_policy");
router.on("/conditions-generales-utilisation").renderInertia("cgu", {}).as("cgu");

// ─── Auth ─────────────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get("signup", [NewAccountController, "create"]).as("new_account.create");
    router.post("signup", [NewAccountController, "store"]).as("new_account.store");
    router.get("login", [SessionController, "create"]).as("session.create");
    router.post("login", [SessionController, "store"]).as("session.store");
  })
  .use(middleware.guest());

router
  .group(() => {
    router.post("logout", [SessionController, "destroy"]).as("session.destroy");
  })
  .use(middleware.auth());

// ─── Spotify OAuth ────────────────────────────────────────────────────────────
router.get("/auth/spotify", [SpotifyOAuthController, "redirect"]).as("spotify.redirect");
router.get("/auth/spotify/callback", [SpotifyOAuthController, "callback"]).as("spotify.callback");

// ─── Profile ──────────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get("/profile", [ProfileController, "show"]).as("profile.show");
    router.get("/profile/:id", [ProfileController, "show"]).as("profile.view");
    router.post("/profile", [ProfileController, "update"]).as("profile.update");
  })
  .use(middleware.auth());

// ─── Leaderboard ──────────────────────────────────────────────────────────────
router
  .get("/leaderboard", [LeaderboardController, "index"])
  .as("leaderboard.index")
  .use(middleware.auth());

router
  .group(() => {
    router
      .post("/friends/:userId/request", [FriendshipController, "request"])
      .as("friends.request");
    router.post("/friends/:id/accept", [FriendshipController, "accept"]).as("friends.accept");
    router.post("/friends/:id/decline", [FriendshipController, "decline"]).as("friends.decline");
  })
  .use(middleware.auth());

router
  .group(() => {
    router.get("/practice", [PracticeController, "index"]).as("practice.index");
    router.get("/bandle", [PracticeController, "bandle"]).as("bandle.index");
    router.get("/party", [PlaylistController, "party"]).as("party.index");
    router.get("/practice/question", [PracticeController, "question"]).as("practice.question");
    router.get("/audio/preview", [PracticeController, "preview"]).as("practice.preview");
  })
  .use(middleware.auth());

// ─── Game ─────────────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get("/playlists", [PlaylistController, "index"]).as("playlists.index");
    router.get("/playlists/create", [PlaylistController, "create"]).as("playlists.create");
    router.post("/playlists", [PlaylistController, "store"]).as("playlists.store");
    router.get("/playlists/:id/play", [PlaylistController, "play"]).as("playlists.play");
    router.get("/playlists/:id/party", [PlaylistController, "party"]).as("playlists.party");
    router.get("/playlists/:id/edit", [PlaylistController, "edit"]).as("playlists.edit");
    router.post("/playlists/:id", [PlaylistController, "update"]).as("playlists.update");
    router.post("/playlists/:id/delete", [PlaylistController, "destroy"]).as("playlists.destroy");
    router
      .get("/playlists/:id/tracks/search", [PlaylistController, "searchTracks"])
      .as("playlists.tracks.search");
    router
      .post("/playlists/:id/tracks", [PlaylistController, "addTrack"])
      .as("playlists.tracks.add");
    router
      .post("/playlists/:id/tracks/delete", [PlaylistController, "removeTracks"])
      .as("playlists.tracks.remove");
    router.post("/playlists/:id/share", [PlaylistController, "share"]).as("playlists.share");
    router
      .post("/playlists/:id/share/:shareId/delete", [PlaylistController, "unshare"])
      .as("playlists.unshare");
    router.get("/game", [GameController, "index"]).as("game.index");
    router
      .post("/game/starter-playlist", [GameController, "createStarterPlaylist"])
      .as("game.starter_playlist");
    router.post("/game", [GameController, "create"]).as("game.create");
    router.get("/game/:id", [GameController, "lobby"]).as("game.lobby");
    router.post("/game/:id/join", [GameController, "join"]).as("game.join");
    router.post("/game/:id/start", [GameController, "start"]).as("game.start");
    router.get("/game/:id/play", [GameController, "play"]).as("game.play");
    router.post("/game/:id/answer", [GameController, "answer"]).as("game.answer");
    router.post("/game/:id/leave", [GameController, "leave"]).as("game.leave");
    router.get("/game/:id/results", [GameController, "results"]).as("game.results");
    router.post("/game/:id/replay", [GameController, "replay"]).as("game.replay");
    router.get("/game/:id/state", [GameController, "state"]).as("game.state");
  })
  .use(middleware.auth());

// ─── Admin ────────────────────────────────────────────────────────────────────
router
  .group(() => {
    router.get("/admin", [AdminController, "dashboard"]).as("admin.dashboard");
    router.get("/admin/users", [AdminController, "users"]).as("admin.users");
    router.post("/admin/users/:id/ban", [AdminController, "banUser"]).as("admin.ban");
    router.post("/admin/users/:id/suspend", [AdminController, "suspendUser"]).as("admin.suspend");
    router.post("/admin/users/:id/unban", [AdminController, "unbanUser"]).as("admin.unban");
    router.get("/admin/playlists", [AdminController, "playlists"]).as("admin.playlists");
    router
      .post("/admin/playlists/import", [AdminController, "importPlaylist"])
      .as("admin.playlists.import");
    router
      .post("/admin/playlists/:id/toggle", [AdminController, "togglePlaylist"])
      .as("admin.playlists.toggle");
    router
      .post("/admin/playlists/:id/tracks/:trackId", [AdminController, "updatePlaylistTrack"])
      .as("admin.playlists.tracks.update");
  })
  .use([middleware.auth(), middleware.admin()]);

// ─── Clock API (sync audio) ───────────────────────────────────────────────────
router.get("/api/clock", async ({ response }) => {
  return response.json({ serverNow: Date.now() });
});
