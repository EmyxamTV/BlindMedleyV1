import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    await auth.check();
    const user = auth.user;

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return response.forbidden({ error: "Accès refusé" });
    }

    return next();
  }
}
