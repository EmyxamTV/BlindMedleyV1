import type { HttpContext } from '@adonisjs/core/http'
import Friendship from '#models/friendship'
import User from '#models/user'

export default class FriendshipController {
  async request({ params, auth, response, session }: HttpContext) {
    const userId = Number(params.userId)
    if (!Number.isInteger(userId) || userId === auth.user!.id) {
      session.flash('error', 'Cette demande d ami est invalide.')
      return response.redirect().back()
    }

    await User.findOrFail(userId)
    const existing = await Friendship.query()
      .where((query) => {
        query
          .where('requester_id', auth.user!.id)
          .where('addressee_id', userId)
          .orWhere((nested) => nested.where('requester_id', userId).where('addressee_id', auth.user!.id))
      })
      .first()

    if (existing) {
      session.flash('error', 'Une relation existe deja avec ce joueur.')
    } else {
      await Friendship.create({ requesterId: auth.user!.id, addresseeId: userId, status: 'pending' })
      session.flash('success', 'Demande d ami envoyee.')
    }
    return response.redirect().back()
  }

  async accept({ params, auth, response, session }: HttpContext) {
    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addressee_id', auth.user!.id)
      .where('status', 'pending')
      .firstOrFail()
    await friendship.merge({ status: 'accepted' }).save()
    session.flash('success', 'Demande d ami acceptee.')
    return response.redirect().back()
  }

  async decline({ params, auth, response, session }: HttpContext) {
    const friendship = await Friendship.query()
      .where('id', params.id)
      .where('addressee_id', auth.user!.id)
      .where('status', 'pending')
      .firstOrFail()
    await friendship.delete()
    session.flash('success', 'Demande refusee.')
    return response.redirect().back()
  }
}
