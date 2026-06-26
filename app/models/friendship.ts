import { belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { FriendshipSchema } from "#database/schema";
import User from "#models/user";

export default class Friendship extends FriendshipSchema {
  declare status: "pending" | "accepted" | "blocked";

  @belongsTo(() => User, { foreignKey: "requesterId" })
  declare requester: BelongsTo<typeof User>;

  @belongsTo(() => User, { foreignKey: "addresseeId" })
  declare addressee: BelongsTo<typeof User>;
}
