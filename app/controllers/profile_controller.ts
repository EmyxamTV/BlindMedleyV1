import type { HttpContext } from '@adonisjs/core/http'
import Profile from '#models/profile'
import User from '#models/user'
import GamePlayer from '#models/game_player'
import { updateProfileValidator } from '#validators/profile_validators'

export default class ProfileController {
  async show({ inertia, params, auth }: HttpContext) {
    const user = await User.query()
      .where('id', params.id ?? auth.user!.id)
      .preload('profile')
      .preload('achievements')
      .firstOrFail()

    const recentGames = await GamePlayer.query()
      .where('user_id', user.id)
      .preload('game', (q) => q.preload('playlist'))
      .orderBy('joined_at', 'desc')
      .limit(10)

    return inertia.render('profile', {
      profileUser: {
        id: user.id,
        fullName: user.fullName,
        initials: user.initials,
        profile: user.profile,
        achievements: user.achievements,
        isCurrentUser: auth.user?.id === user.id,
      },
      recentGames: recentGames.map((gp) => ({
        id: gp.game.id,
        mode: gp.game.mode,
        status: gp.game.status,
        playlistName: gp.game.playlist?.name ?? 'Playlist inconnue',
        score: gp.score,
        rank: gp.rank,
        correct: gp.correct,
        incorrect: gp.incorrect,
        xpEarned: gp.xpEarned,
        playedAt: gp.joinedAt,
      })),
    })
  }

  async update({ request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(updateProfileValidator)

    let profile = await Profile.query().where('user_id', user.id).first()
    if (!profile) {
      profile = await Profile.create({ userId: user.id, username: payload.username ?? user.email.split('@')[0] })
    }

    await profile
      .merge({
        username: payload.username ?? profile.username,
        bio: payload.bio ?? profile.bio,
        country: payload.country ?? profile.country,
        avatarUrl: payload.avatarUrl ?? profile.avatarUrl,
      })
      .save()

    session.flash('success', 'Profil mis à jour')
    return response.redirect().back()
  }
}
