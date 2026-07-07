import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import hash from "@adonisjs/core/services/hash";
import crypto from "node:crypto";
import Profile from "#models/profile";
import User from "#models/user";
import GamePlayer from "#models/game_player";
import GamePlayerTransformer from "#transformers/game_player_transformer";
import UserTransformer from "#transformers/user_transformer";
import { usernameFromName } from "#services/display_name";
import { updatePasswordValidator, updateProfileValidator } from "#validators/profile_validators";

export default class ProfileController {
  async show({ inertia, params, auth }: HttpContext) {
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

    return inertia.render("profile", {
      profileUser: UserTransformer.transform(user),
      isCurrentUser: auth.user?.id === user.id,
      recentGames: GamePlayerTransformer.transform(recentGames),
    });
  }

  async update({ request, auth, response, session }: HttpContext) {
    const user = auth.user!;
    const payload = await request.validateUsing(updateProfileValidator);
    const avatar = request.file("avatar", {
      size: "3mb",
      extnames: ["jpg", "jpeg", "png", "webp", "gif"],
    });

    if (avatar && !avatar.isValid) {
      session.flash(
        "error",
        "Image de profil invalide. Utilise un fichier JPG, PNG, WebP ou GIF de 3 Mo maximum.",
      );
      return response.redirect().back();
    }

    if (payload.avatarUrl) {
      try {
        const parsedAvatarUrl = new URL(payload.avatarUrl);
        if (!["http:", "https:"].includes(parsedAvatarUrl.protocol)) throw new Error("INVALID_URL");
      } catch {
        session.flash("error", "URL d’image de profil invalide.");
        return response.redirect().back();
      }
    }

    if (payload.email && payload.email !== user.email) {
      if (!payload.currentPassword || !(await hash.verify(user.password, payload.currentPassword))) {
        session.flash("error", "Mot de passe actuel incorrect.");
        return response.redirect().back();
      }

      const existingEmail = await User.query()
        .where("email", payload.email)
        .whereNot("id", user.id)
        .first();

      if (existingEmail) {
        session.flash("error", "Cette adresse email est déjà utilisée.");
        return response.redirect().back();
      }

      await user.merge({ email: payload.email }).save();
    }

    if (payload.fullName !== undefined) {
      await user.merge({ fullName: payload.fullName || null }).save();
    }

    let profile = await Profile.query().where("user_id", user.id).first();
    if (!profile) {
      profile = await Profile.create({
        userId: user.id,
        username: payload.username ?? usernameFromName(user.fullName, user.email.split("@")[0]),
      });
    }

    let avatarUrl = payload.avatarUrl?.trim() || profile.avatarUrl;
    if (avatar) {
      const extension = avatar.extname ?? "jpg";
      const fileName = `${user.id}-${crypto.randomUUID()}.${extension}`;
      await avatar.move(app.publicPath("uploads/avatars"), {
        name: fileName,
        overwrite: true,
      });
      avatarUrl = `/uploads/avatars/${fileName}`;
    }

    await profile
      .merge({
        username: payload.username ?? profile.username,
        bio: payload.bio ?? profile.bio,
        country: payload.country?.toUpperCase() ?? profile.country,
        avatarUrl,
      })
      .save();

    session.flash("success", "Profil mis à jour.");
    return response.redirect().back();
  }

  async updatePassword({ request, auth, response, session }: HttpContext) {
    const user = auth.user!;
    const payload = await request.validateUsing(updatePasswordValidator);

    if (!(await hash.verify(user.password, payload.currentPassword))) {
      session.flash("error", "Mot de passe actuel incorrect.");
      return response.redirect().back();
    }

    await user.merge({ password: await hash.make(payload.password) }).save();
    session.flash("success", "Mot de passe mis à jour.");
    return response.redirect().back();
  }
}
