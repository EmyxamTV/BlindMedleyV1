import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Game from '#models/game'
import Playlist from '#models/playlist'
import spotifyService from '#services/spotify_service'
import deezerService from '#services/deezer_service'
import { DateTime } from 'luxon'

export default class AdminController {
  async dashboard({ inertia }: HttpContext) {
    const [totalUsers, totalGames, activePlaylists] = await Promise.all([
      User.query().count('* as total'),
      Game.query().count('* as total'),
      Playlist.query().where('is_active', true).count('* as total'),
    ])

    const recentGames = await Game.query()
      .whereIn('status', ['finished', 'active'])
      .orderBy('created_at', 'desc')
      .preload('playlist')
      .limit(5)

    return inertia.render('admin/dashboard', {
      stats: {
        totalUsers: Number(totalUsers[0].$extras.total),
        totalGames: Number(totalGames[0].$extras.total),
        activePlaylists: Number(activePlaylists[0].$extras.total),
      },
      recentGames: recentGames.map((g) => ({
        id: g.id,
        mode: g.mode,
        status: g.status,
        playlistName: g.playlist?.name ?? '?',
        createdAt: g.createdAt,
      })),
    })
  }

  async users({ inertia, request }: HttpContext) {
    const page = Number(request.qs().page ?? 1)
    const search = request.qs().search as string | undefined
    const status = request.qs().status as string | undefined

    const query = User.query().preload('profile').orderBy('created_at', 'desc')

    if (search) {
      query.where((q) => {
        q.where('email', 'like', `%${search}%`).orWhereHas('profile', (pq) =>
          pq.where('username', 'like', `%${search}%`)
        )
      })
    }
    if (status) query.where('status', status)

    const users = await query.paginate(page, 20)

    return inertia.render('admin/users', {
      users: users.all().map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        username: u.profile?.username,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      })),
      meta: users.getMeta(),
      search: search ?? '',
      statusFilter: status ?? '',
    })
  }

  async banUser({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const reason = request.input('reason', 'Violation des règles')
    const duration = request.input('duration') // en heures, null = permanent

    await user
      .merge({
        status: 'banned',
        banReason: reason,
        banExpires_at: duration ? DateTime.now().plus({ hours: Number(duration) }) : null,
      })
      .save()

    session.flash('success', `${user.email} banni avec succès`)
    return response.redirect().back()
  }

  async suspendUser({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const hours = Number(request.input('hours', 24))

    await user
      .merge({
        status: 'suspended',
        banExpires_at: DateTime.now().plus({ hours }),
      })
      .save()

    session.flash('success', `${user.email} suspendu pour ${hours}h`)
    return response.redirect().back()
  }

  async unbanUser({ params, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.merge({ status: 'active', banReason: null, banExpires_at: null }).save()
    session.flash('success', `${user.email} débanni`)
    return response.redirect().back()
  }

  async playlists({ inertia }: HttpContext) {
    const playlists = await Playlist.query().orderBy('created_at', 'desc')
    return inertia.render('admin/playlists', {
      playlists: playlists.map((p) => ({
        id: p.id,
        name: p.name,
        spotifyId: p.spotifyId,
        genre: p.genre,
        difficulty: p.difficulty,
        trackCount: p.trackCount,
        isActive: p.isActive,
        lastSyncedAt: p.lastSyncedAt,
      })),
    })
  }

  async importPlaylist({ request, response, session }: HttpContext) {
    const url = (request.input('spotify_url') as string).trim()

    try {
      // Deezer : https://www.deezer.com/fr/playlist/1234567890
      const deezerMatch = url.match(/deezer\.com\/(?:[a-z]+\/)?playlist\/(\d+)/)
      if (deezerMatch) {
        await deezerService.importPlaylist(deezerMatch[1])
        session.flash('success', 'Playlist Deezer importée avec succès')
        return response.redirect().back()
      }

      // Spotify : https://open.spotify.com/playlist/xxxxx
      const spotifyMatch = url.match(/playlist\/([a-zA-Z0-9]+)/)
      if (spotifyMatch) {
        await spotifyService.importPlaylist(spotifyMatch[1])
        session.flash('success', 'Playlist Spotify importée avec succès (previews Deezer)')
        return response.redirect().back()
      }

      session.flash('error', 'URL invalide — colle une URL Spotify ou Deezer')
    } catch (err) {
      session.flash('error', `Erreur lors de l'import : ${err.message}`)
    }

    return response.redirect().back()
  }

  async togglePlaylist({ params, response, session }: HttpContext) {
    const playlist = await Playlist.findOrFail(params.id)
    await playlist.merge({ isActive: !playlist.isActive }).save()
    session.flash('success', `Playlist ${playlist.isActive ? 'activée' : 'désactivée'}`)
    return response.redirect().back()
  }
}
