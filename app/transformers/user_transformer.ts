import type User from "#models/user";
import { BaseTransformer } from "@adonisjs/core/transformers";
import AchievementTransformer from "#transformers/achievement_transformer";
import ProfileTransformer from "#transformers/profile_transformer";
import { displayUsername } from "#services/display_name";

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        "id",
        "fullName",
        "email",
        "role",
        "status",
        "spotifyId",
        "createdAt",
        "updatedAt",
        "initials",
      ]),
      username: displayUsername(this.resource.profile?.username),
      avatarUrl: this.resource.profile?.avatarUrl ?? null,
      profile: ProfileTransformer.transform(this.whenLoaded(this.resource.profile)),
      achievements: AchievementTransformer.transform(this.whenLoaded(this.resource.achievements)),
    };
  }
}
