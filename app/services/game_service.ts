import Game from '#models/game'
import GamePlayer from '#models/game_player'
import Round from '#models/round'
import roundService from '#services/round_service'
import scoreService from '#services/score_service'
import xpService from '#services/xp_service'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import type { GameMode } from '#models/game'
import transmit from '@adonisjs/transmit/services/main'

export class GameService {
  async createGame(options: {
    mode: GameMode
    playlistId: number
    difficulty?: number
    maxPlayers?: number
    roundCount?: number
    roundDurationMs?: number
    hostId: number
  }): Promise<Game> {
    const game = await Game.create({
      mode: options.mode,
      playlistId: options.playlistId,
      difficulty: options.difficulty ?? 2,
      maxPlayers: options.mode === 'solo' ? 1 : (options.maxPlayers ?? 8),
      roundCount: options.roundCount ?? 10,
      roundDurationMs: options.roundDurationMs ?? 30000,
      hostId: options.hostId,
      status: 'waiting',
      currentRound: 0,
      publicId: this.generatePublicId(),
      code: options.mode === 'private' ? this.generateCode() : null,
    })

    // Ajouter l'hôte en tant que joueur
    await GamePlayer.create({
      gameId: game.id,
      userId: options.hostId,
      joinedAt: DateTime.now(),
    })

    // Pré-générer tous les rounds
    await roundService.pregenerateRounds(game.id, options.playlistId, game.roundCount)

    return game
  }

  async joinGame(gameId: number, userId: number): Promise<GamePlayer> {
    const game = await Game.findOrFail(gameId)

    if (game.status !== 'waiting') throw new Error('GAME_NOT_WAITING')

    const playerCount = await GamePlayer.query().where('game_id', gameId).count('* as total')
    if (Number(playerCount[0].$extras.total) >= game.maxPlayers) {
      throw new Error('GAME_FULL')
    }

    const existing = await GamePlayer.query()
      .where('game_id', gameId)
      .where('user_id', userId)
      .first()
    if (existing) return existing

    return GamePlayer.create({
      gameId,
      userId,
      joinedAt: DateTime.now(),
    })
  }

  async startGame(gameId: number, hostId: number): Promise<Game> {
    const game = await Game.findOrFail(gameId)

    if (game.hostId !== hostId) throw new Error('NOT_HOST')
    if (game.status !== 'waiting') throw new Error('GAME_NOT_WAITING')

    const playerCount = await GamePlayer.query().where('game_id', gameId).count('* as total')
    if (game.mode !== 'solo' && Number(playerCount[0].$extras.total) < 2) {
      throw new Error('NOT_ENOUGH_PLAYERS')
    }

    await game.merge({ status: 'starting', startedAt: DateTime.now() }).save()

    // Notifier le lobby que la partie démarre
    transmit.broadcast(`game/${game.publicId}`, { event: 'game_starting' })

    // Démarrer le premier round après un countdown de 3s
    setTimeout(() => this.startRound(game.id, 1).catch(console.error), 3000)

    return game
  }

  async startRound(gameId: number, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId)
    if (game.status === 'finished' || game.status === 'cancelled') return

    const round = await Round.query()
      .where('game_id', gameId)
      .where('round_number', roundNumber)
      .firstOrFail()

    await roundService.startRound(round, game.roundDurationMs)
    await game.merge({ status: 'active', currentRound: roundNumber }).save()

    // Broadcaster le round à tous les joueurs
    const serverNow = Date.now()
    const roundPayload = await roundService.buildClientPayload(round, serverNow)
    transmit.broadcast(`game/${game.publicId}`, { event: 'round_started', ...roundPayload })

    // Planifier la fin du round
    setTimeout(() => this.endRound(game.id, roundNumber).catch(console.error), game.roundDurationMs)
  }

  async endRound(gameId: number, roundNumber: number): Promise<void> {
    const game = await Game.findOrFail(gameId)
    if (game.status === 'finished') return

    const round = await Round.query()
      .where('game_id', gameId)
      .where('round_number', roundNumber)
      .preload('track')
      .firstOrFail()

    // Éviter la double exécution (solo : timer annulé mais callback déjà parti)
    if (round.revealedAt) return

    await roundService.revealRound(round)

    // Broadcaster la révélation de la bonne réponse
    const revealPayload = roundService.buildRevealPayload(round)
    transmit.broadcast(`game/${game.publicId}`, { event: 'round_revealed', ...revealPayload })

    if (roundNumber >= game.roundCount) {
      await this.finishGame(game.id)
    } else {
      // Pause entre les rounds (2s en solo, 5s en multi)
      const pause = game.mode === 'solo' ? 2000 : 5000
      setTimeout(() => this.startRound(game.id, roundNumber + 1).catch(console.error), pause)
    }
  }

  async finishGame(gameId: number): Promise<Game> {
    const game = await Game.findOrFail(gameId)

    const players = await GamePlayer.query()
      .where('game_id', gameId)
      .orderBy('score', 'desc')

    // Assigner les rangs et XP earned (sans awardXp pour ne pas bloquer)
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const rank = i + 1
      const xpEarned = xpService.calculateGameXp(player, rank, players.length)
      await player.merge({ rank, xpEarned }).save()
    }

    const winner = players[0]
    const finishedGame = await game
      .merge({
        status: 'finished',
        finishedAt: DateTime.now(),
        winnerId: winner?.userId ?? null,
      })
      .save()

    // Broadcaster en premier — la partie est terminée quoi qu'il arrive
    transmit.broadcast(`game/${game.publicId}`, { event: 'game_finished' })

    // Mettre à jour les profils XP (non bloquant)
    for (const player of players) {
      xpService.awardXp(player.userId, player.xpEarned, player).catch(console.error)
    }

    return finishedGame
  }

  async getGameState(gameId: number) {
    const game = await Game.query()
      .where('id', gameId)
      .preload('players', (q) => q.preload('user', (uq) => uq.preload('profile')))
      .preload('playlist')
      .firstOrFail()

    const currentRound =
      game.currentRound > 0
        ? await Round.query()
            .where('game_id', gameId)
            .where('round_number', game.currentRound)
            .preload('track')
            .first()
        : null

    return { game, currentRound }
  }

  async submitAnswer(params: {
    gameId: number
    userId: number
    roundNumber: number
    answerTrackId: number | null
    answerText: string | null
  }) {
    const serverReceivedAt = Date.now()

    const game = await Game.findOrFail(params.gameId)
    if (game.status !== 'active') throw new Error('GAME_NOT_ACTIVE')
    if (game.currentRound !== params.roundNumber) throw new Error('WRONG_ROUND')

    const [round, gamePlayer] = await Promise.all([
      Round.query()
        .where('game_id', params.gameId)
        .where('round_number', params.roundNumber)
        .preload('track')
        .firstOrFail(),
      GamePlayer.query()
        .where('game_id', params.gameId)
        .where('user_id', params.userId)
        .firstOrFail(),
    ])

    const result = await scoreService.processAnswer({
      round,
      gamePlayer,
      answerTrackId: params.answerTrackId,
      answerText: params.answerText,
      serverReceivedAt,
    })

    // Broadcaster la mise à jour des scores
    const updatedPlayers = await GamePlayer.query()
      .where('game_id', params.gameId)
      .preload('user', (q) => q.preload('profile'))

    transmit.broadcast(`game/${game.publicId}`, {
      event: 'scores_updated',
      players: updatedPlayers.map((p) => ({
        userId: p.userId,
        username: p.user?.profile?.username ?? `User${p.userId}`,
        score: p.score,
        streak: p.streak,
        correct: p.correct,
        incorrect: p.incorrect,
      })),
    })

    // En mode solo : déclencher la fin du round dès que le joueur a répondu
    // revealedAt dans endRound empêche la double exécution si le timer normal se déclenche après
    if (game.mode === 'solo') {
      setTimeout(() => this.endRound(game.id, params.roundNumber).catch(console.error), 1500)
    }

    return result
  }

  private generatePublicId(): string {
    return crypto.randomBytes(6).toString('hex') // 12 hex chars
  }

  private generateCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase()
  }
}

export default new GameService()
