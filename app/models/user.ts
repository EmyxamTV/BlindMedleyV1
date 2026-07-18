import { DateTime } from "luxon";
import hash from "@adonisjs/core/services/hash";
import { compose } from "@adonisjs/core/helpers";
import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { hasOne, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasOne, HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import { UserSchema } from "#database/schema";
import Profile from "#models/profile";
import GamePlayer from "#models/game_player";
import Game from "#models/game";
import Achievement from "#models/achievement";
import Friendship from "#models/friendship";
import PlaylistShare from "#models/playlist_share";
import Playlist from "#models/playlist";
import Answer from "#models/answer";
import LeaderboardSnapshot from "#models/leaderboard_snapshot";

/**
 * Le service `hash` est initialisé une fois l'application Adonis démarrée.
 * Le fournir via une fonction évite de capturer sa valeur `undefined` lors de
 * l'import initial du modèle, avant que le provider de hash soit prêt.
 */
export default class User extends compose(UserSchema, withAuthFinder(() => hash.use())) {
  declare role: "player" | "moderator" | "admin";

  declare status: "active" | "suspended" | "banned";

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>;

  @hasMany(() => GamePlayer)
  declare gamePlayers: HasMany<typeof GamePlayer>;

  @hasMany(() => Game, { foreignKey: "hostId" })
  declare hostedGames: HasMany<typeof Game>;

  @hasMany(() => Game, { foreignKey: "winnerId" })
  declare wonGames: HasMany<typeof Game>;

  @hasMany(() => Playlist, { foreignKey: "createdBy" })
  declare playlists: HasMany<typeof Playlist>;

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>;

  @hasMany(() => LeaderboardSnapshot)
  declare leaderboardSnapshots: HasMany<typeof LeaderboardSnapshot>;

  @manyToMany(() => Achievement, {
    pivotTable: "user_achievements",
    pivotColumns: ["unlocked_at"],
  })
  declare achievements: ManyToMany<typeof Achievement>;

  @hasMany(() => Friendship, { foreignKey: "requesterId" })
  declare sentFriendRequests: HasMany<typeof Friendship>;

  @hasMany(() => Friendship, { foreignKey: "addresseeId" })
  declare receivedFriendRequests: HasMany<typeof Friendship>;

  @hasMany(() => PlaylistShare)
  declare playlistShares: HasMany<typeof PlaylistShare>;

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(" ") : this.email.split("@");
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    return `${first.slice(0, 2)}`.toUpperCase();
  }

  get isAdmin() {
    return this.role === "admin";
  }

  get isModerator() {
    return this.role === "moderator" || this.role === "admin";
  }

  get isBanned() {
    if (this.status !== "banned") return false;
    if (this.banExpiresAt && this.banExpiresAt < DateTime.now()) return false;
    return true;
  }
}
