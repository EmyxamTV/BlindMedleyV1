import User from "#models/user";
import Profile from "#models/profile";
import { signupValidator } from "#validators/user";
import type { HttpContext } from "@adonisjs/core/http";
import { usernameFromName } from "#services/display_name";

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render("auth/signup", {});
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator);
    const user = await User.create({ ...payload });

    // Créer le profil dès l'inscription pour que les stats soient bien enregistrées
    const defaultUsername = usernameFromName(payload.fullName, "");
    await Profile.create({
      userId: user.id,
      username: defaultUsername || `joueur${user.id}`,
    });

    await auth.use("web").login(user);
    response.redirect().toRoute("home");
  }
}
