import User from '#models/user'
import Profile from '#models/profile'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)
    const user = await User.create({ ...payload })

    // Créer le profil dès l'inscription pour que les stats soient bien enregistrées
    const defaultUsername = payload.fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    await Profile.create({
      userId: user.id,
      username: defaultUsername || `joueur${user.id}`,
    })

    await auth.use('web').login(user)
    response.redirect().toRoute('home')
  }
}
