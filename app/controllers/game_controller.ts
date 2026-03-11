import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GamePlayer from '#models/game_player'
import Playlist from '#models/playlist'
import gameService from '#services/game_service'
import roundService from '#services/round_service'
import { createGameValidator, submitAnswerValidator } from '#validators/game_validators'

export default class GameController {
  // ── Résoudre un publicId → Game (lève 404 si introuvable) ─────────────
  private async resolveGame(publicId: string): Promise<Game> {
    return Game.query().where('public_id', publicId).firstOrFail()
  }

  // Page lobby / création
  async index({ inertia, auth }: HttpContext) {
    const playlists = await Playlist.query().where('is_active', true).orderBy('name')

    const publicGames = await Game.query()
      .where('status', 'waiting')
      .where('mode', 'public')
      .preload('host', (q) => q.preload('profile'))
      .preload('players')
      .preload('playlist')
      .orderBy('created_at', 'desc')
      .limit(10)

    const myActiveGame = await GamePlayer.query()
      .where('user_id', auth.user!.id)
      .whereHas('game', (q) => q.whereIn('status', ['waiting', 'starting', 'active']))
      .preload('game')
      .first()

    return inertia.render('game/index', {
      playlists: playlists.map((p) => ({ id: p.id, name: p.name, trackCount: p.trackCount, genre: p.genre, difficulty: p.difficulty })),
      publicGames: publicGames.map((g) => ({
        id: g.publicId ?? g.id,
        code: g.code,
        mode: g.mode,
        playlistName: g.playlist?.name ?? '?',
        hostUsername: g.host?.profile?.username ?? g.host?.fullName ?? 'Hôte',
        playerCount: g.players.length,
        maxPlayers: g.maxPlayers,
        difficulty: g.difficulty,
        createdAt: g.createdAt,
      })),
      myActiveGameId: myActiveGame?.game?.publicId ?? null,
    })
  }

  // Créer une partie
  async create({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(createGameValidator)

    const game = await gameService.createGame({
      mode: payload.mode as 'solo' | 'public' | 'private',
      playlistId: payload.playlistId,
      difficulty: payload.difficulty,
      maxPlayers: payload.maxPlayers,
      roundCount: payload.roundCount,
      hostId: auth.user!.id,
    })

    return response.redirect().toRoute('game.lobby', { id: game.publicId })
  }

  // Page lobby d'une partie
  async lobby({ inertia, params, auth }: HttpContext) {
    const resolved = await this.resolveGame(params.id)
    const { game } = await gameService.getGameState(resolved.id)

    const isPlayer = game.players.some((p) => p.userId === auth.user!.id)
    if (!isPlayer && game.mode !== 'public') {
      return inertia.render('errors/not_found', {})
    }

    return inertia.render('game/lobby', {
      game: this.serializeGame(game),
      isHost: game.hostId === auth.user!.id,
    })
  }

  // Rejoindre une partie publique ou avec un code
  async join({ request, params, auth, response, session }: HttpContext) {
    const code = request.input('code') as string | undefined
    let game: Game

    if (code) {
      const found = await Game.query().where('code', code).where('status', 'waiting').first()
      if (!found) {
        session.flash('error', 'Code de partie invalide ou partie démarrée')
        return response.redirect().back()
      }
      game = found
    } else {
      game = await this.resolveGame(params.id)
    }

    await gameService.joinGame(game.id, auth.user!.id)
    return response.redirect().toRoute('game.lobby', { id: game.publicId })
  }

  // Démarrer la partie (hôte seulement)
  async start({ params, auth, response, session }: HttpContext) {
    try {
      const game = await this.resolveGame(params.id)
      await gameService.startGame(game.id, auth.user!.id)
      return response.redirect().toRoute('game.play', { id: params.id })
    } catch (err) {
      session.flash('error', err.message)
      return response.redirect().back()
    }
  }

  // Page de jeu
  async play({ inertia, params, auth }: HttpContext) {
    const resolved = await this.resolveGame(params.id)
    const { game, currentRound } = await gameService.getGameState(resolved.id)

    const isPlayer = game.players.some((p) => p.userId === auth.user!.id)
    if (!isPlayer) {
      return inertia.render('errors/not_found', {})
    }

    if (game.status === 'finished') {
      return inertia.location(`/game/${params.id}/results`)
    }

    const myPlayer = game.players.find((p) => p.userId === auth.user!.id)!

    let roundPayload = null
    if (currentRound && currentRound.startsAt) {
      const serverNow = Date.now()
      roundPayload = await roundService.buildClientPayload(currentRound, serverNow)

      const answered = await GamePlayer.query()
        .where('id', myPlayer.id)
        .whereHas('answers', (q) => q.where('round_id', currentRound.id))
        .first()
      ;(roundPayload as Record<string, unknown>).alreadyAnswered = Boolean(answered)
    }

    return inertia.render('game/play', {
      game: this.serializeGame(game),
      myPlayer: {
        id: myPlayer.id,
        score: myPlayer.score,
        streak: myPlayer.streak,
        correct: myPlayer.correct,
        incorrect: myPlayer.incorrect,
      },
      round: roundPayload,
      serverNow: Date.now(),
    })
  }

  // Soumettre une réponse
  async answer({ request, params, auth, response }: HttpContext) {
    const resolved = await this.resolveGame(params.id)
    const payload = await request.validateUsing(submitAnswerValidator)

    const result = await gameService.submitAnswer({
      gameId: resolved.id,
      userId: auth.user!.id,
      roundNumber: payload.roundNumber,
      answerTrackId: payload.answerTrackId ?? null,
      answerText: payload.answerText ?? null,
    })

    if (request.accepts(['json'])) {
      return response.json({ success: true, ...result })
    }

    return response.redirect().toRoute('game.play', { id: params.id })
  }

  // Page résultats
  async results({ inertia, params, auth }: HttpContext) {
    const game = await Game.query()
      .where('public_id', params.id)
      .where('status', 'finished')
      .preload('players', (q) =>
        q.orderBy('rank').preload('user', (uq) => uq.preload('profile'))
      )
      .preload('playlist')
      .firstOrFail()

    const myPlayer = game.players.find((p) => p.userId === auth.user!.id)

    return inertia.render('game/results', {
      game: {
        id: game.publicId,
        mode: game.mode,
        playlistName: game.playlist?.name ?? '?',
        roundCount: game.roundCount,
        finishedAt: game.finishedAt,
      },
      players: game.players.map((p) => ({
        rank: p.rank,
        username: p.user?.profile?.username ?? p.user?.fullName ?? `User${p.userId}`,
        avatarUrl: p.user?.profile?.avatarUrl,
        score: p.score,
        correct: p.correct,
        incorrect: p.incorrect,
        bestStreak: p.bestStreak,
        xpEarned: p.xpEarned,
        isMe: p.userId === auth.user!.id,
      })),
      myXpEarned: myPlayer?.xpEarned ?? 0,
    })
  }

  // API: état courant de la partie (polling)
  async state({ params, response }: HttpContext) {
    const resolved = await this.resolveGame(params.id)
    const { game, currentRound } = await gameService.getGameState(resolved.id)
    const serverNow = Date.now()

    let roundPayload = null
    if (currentRound?.startsAt) {
      roundPayload = await roundService.buildClientPayload(currentRound, serverNow)
    }

    return response.json({
      status: game.status,
      currentRound: game.currentRound,
      round: roundPayload,
      serverNow,
      scores: game.players.map((p) => ({
        userId: p.userId,
        username: p.user?.profile?.username ?? `User${p.userId}`,
        score: p.score,
        streak: p.streak,
      })),
    })
  }

  private serializeGame(game: Game) {
    return {
      id: game.publicId ?? String(game.id),
      code: game.code,
      mode: game.mode,
      status: game.status,
      playlistName: game.playlist?.name ?? '?',
      difficulty: game.difficulty,
      maxPlayers: game.maxPlayers,
      roundCount: game.roundCount,
      roundDurationMs: game.roundDurationMs,
      currentRound: game.currentRound,
      hostId: game.hostId,
      startedAt: game.startedAt,
      players: game.players?.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: p.user?.profile?.username ?? p.user?.fullName ?? `User${p.userId}`,
        avatarUrl: p.user?.profile?.avatarUrl,
        score: p.score,
        streak: p.streak,
        isConnected: p.isConnected,
      })),
    }
  }
}
