import { DateTime } from "luxon";
import hash from "@adonisjs/core/services/hash";
import { compose } from "@adonisjs/core/helpers";
import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { column, hasOne, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasOne, HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";
import { UserSchema } from "#database/schema";
import Profile from "#models/profile";
import GamePlayer from "#models/game_player";
import Achievement from "#models/achievement";
import Friendship from "#models/friendship";

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @column()
  declare spotifyId: string | null;

  @column()
  declare spotifyAccessToken: string | null;

  @column()
  declare spotifyRefreshToken: string | null;

  @column.dateTime()
  declare spotifyTokenExpiresAt: DateTime | null;

  @column()
  declare role: "player" | "moderator" | "admin";

  @column()
  declare status: "active" | "suspended" | "banned";

  @column()
  declare banReason: string | null;

  @column.dateTime()
  declare banExpires_at: DateTime | null;

  @column.dateTime()
  declare lastLoginAt: DateTime | null;

  @column()
  declare loginAttempts: number;

  @column.dateTime()
  declare lockedUntil: DateTime | null;

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>;

  @hasMany(() => GamePlayer)
  declare gamePlayers: HasMany<typeof GamePlayer>;

  @manyToMany(() => Achievement, {
    pivotTable: "user_achievements",
    pivotColumns: ["unlocked_at"],
  })
  declare achievements: ManyToMany<typeof Achievement>;

  @hasMany(() => Friendship, { foreignKey: "requesterId" })
  declare sentFriendRequests: HasMany<typeof Friendship>;

  @hasMany(() => Friendship, { foreignKey: "addresseeId" })
  declare receivedFriendRequests: HasMany<typeof Friendship>;

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
    if (this.banExpires_at && this.banExpires_at < DateTime.now()) return false;
    return true;
  }
}
