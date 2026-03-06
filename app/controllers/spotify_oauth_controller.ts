import type { HttpContext } from '@adonisjs/core/http'
import spotifyService from '#services/spotify_service'
import User from '#models/user'
import Profile from '#models/profile'
import { DateTime } from 'luxon'
import env from '#start/env'

export default class SpotifyOAuthController {
  async redirect({ response }: HttpContext) {
    const redirectUri = `${env.get('APP_URL')}/auth/spotify/callback`
    const url = spotifyService.buildSpotifyAuthUrl(redirectUri)
    return response.redirect(url)
  }

  async callback({ request, auth, response, session }: HttpContext) {
    const code = request.qs().code as string
    const error = request.qs().error as string | undefined

    if (error || !code) {
      session.flash('error', 'Connexion Spotify annulée')
      return response.redirect().toRoute('session.create')
    }

    const redirectUri = `${env.get('APP_URL')}/auth/spotify/callback`

    const tokens = await spotifyService.exchangeCode(code, redirectUri)
    const spotifyProfile = await spotifyService.getSpotifyProfile(tokens.accessToken)

    // Chercher un user existant par spotify_id ou créer
    let user = await User.query().where('spotify_id', spotifyProfile.id).first()

    if (!user) {
      // Vérifier si un compte existe avec le même email (liaison de compte)
      if (auth.isAuthenticated) {
        user = auth.user!
      } else {
        user = await User.create({
          email: `spotify_${spotifyProfile.id}@blindmedley.app`,
          fullName: spotifyProfile.display_name,
          password: Math.random().toString(36),
          spotifyId: spotifyProfile.id,
          role: 'player',
          status: 'active',
          loginAttempts: 0,
        })
      }
    }

    // Mettre à jour les tokens Spotify
    await user
      .merge({
        spotifyId: spotifyProfile.id,
        spotifyAccessToken: tokens.accessToken,
        spotifyRefreshToken: tokens.refreshToken,
        spotifyTokenExpiresAt: DateTime.now().plus({ seconds: tokens.expiresIn }),
        lastLoginAt: DateTime.now(),
      })
      .save()

    // Créer ou mettre à jour le profil
    const avatarUrl = spotifyProfile.images?.[0]?.url ?? null
    await Profile.updateOrCreate(
      { userId: user.id },
      {
        username: spotifyProfile.display_name?.replace(/\s+/g, '_').toLowerCase() ?? `user_${user.id}`,
        avatarUrl,
      }
    )

    await auth.use('web').login(user)
    return response.redirect().toRoute('home')
  }
}
