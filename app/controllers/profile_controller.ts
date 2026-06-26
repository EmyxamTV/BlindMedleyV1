import type { HttpContext } from "@adonisjs/core/http";
import Profile from "#models/profile";
import User from "#models/user";
import GamePlayer from "#models/game_player";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import UserTransformer from "#transformers/user_transformer";
import { updateProfileValidator } from "#validators/profile_validators";

export default class ProfileController {
  async show({ inertia, params, auth, serialize }: HttpContext) {
    const user = await User.query()
      .where("id", params.id ?? auth.user!.id)
      .preload("profile")
      .preload("achievements")
      .firstOrFail();

    const recentGames = await GamePlayer.query()
      .where("user_id", user.id)
      .preload("game", (q) => q.preload("playlist"))
      .orderBy("joined_at", "desc")
      .limit(10);

    const profileUser = await serialize.withoutWrapping(UserTransformer.transform(user));

    return inertia.render("profile", {
      profileUser: {
        ...profileUser,
        isCurrentUser: auth.user?.id === user.id,
      },
      recentGames: await serialize.withoutWrapping(GamePlayerTransformer.transform(recentGames)),
    });
  }

  async update({ request, auth, response, session }: HttpContext) {
    const user = auth.user!;
    const payload = await request.validateUsing(updateProfileValidator);

    let profile = await Profile.query().where("user_id", user.id).first();
    if (!profile) {
      profile = await Profile.create({
        userId: user.id,
        username: payload.username ?? user.email.split("@")[0],
      });
    }

    await profile
      .merge({
        username: payload.username ?? profile.username,
        bio: payload.bio ?? profile.bio,
        country: payload.country ?? profile.country,
        avatarUrl: payload.avatarUrl ?? profile.avatarUrl,
      })
      .save();

    session.flash("success", "Profil mis à jour");
    return response.redirect().back();
  }
}
