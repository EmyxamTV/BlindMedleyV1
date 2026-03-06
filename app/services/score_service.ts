import Round from '#models/round'
import GamePlayer from '#models/game_player'
import Answer from '#models/answer'
import { DateTime } from 'luxon'

const MAX_SCORE_PER_ROUND = 1000
const SPEED_BONUS_MAX = 500
const COMBO_MULTIPLIERS = [1, 1, 1.2, 1.5, 2, 2.5] // index = streak

export interface AnswerResult {
  correct: boolean
  scoreEarned: number
  responseMs: number
  flags: string[]
}

export class ScoreService {
  async processAnswer(params: {
    round: Round
    gamePlayer: GamePlayer
    answerTrackId: number | null
    answerText: string | null
    serverReceivedAt: number
  }): Promise<AnswerResult> {
    const { round, gamePlayer, serverReceivedAt } = params

    // Vérifier que le round est actif (horloge serveur fait autorité)
    const now = DateTime.now()
    if (!round.startsAt || !round.endsAt) {
      throw new Error('ROUND_NOT_STARTED')
    }
    if (now > round.endsAt) {
      throw new Error('ROUND_ENDED')
    }

    // Vérifier s'il a déjà répondu
    const existing = await Answer.query()
      .where('round_id', round.id)
      .where('game_player_id', gamePlayer.id)
      .first()
    if (existing) {
      throw new Error('ALREADY_ANSWERED')
    }

    // Temps de réponse — calculé côté serveur uniquement
    const responseMs = serverReceivedAt - round.startsAt.toMillis()

    // Validation de la réponse
    const isCorrect = await this.validateAnswer(round, params.answerTrackId, params.answerText)

    // Score calculé côté serveur
    const scoreEarned = isCorrect ? this.calculateScore(responseMs, gamePlayer.streak, round.game?.roundDurationMs ?? 30000) : 0

    // Flags anti-triche
    const flags = this.detectSuspiciousFlags(responseMs, isCorrect, gamePlayer)

    // Persister la réponse
    await Answer.create({
      roundId: round.id,
      gamePlayerId: gamePlayer.id,
      userId: gamePlayer.userId,
      answerTrackId: params.answerTrackId,
      answerText: params.answerText,
      isCorrect,
      scoreEarned,
      responseMs,
      suspiciousFlags: flags,
      submittedAt: DateTime.now(),
    })

    // Mettre à jour le GamePlayer
    if (isCorrect) {
      await gamePlayer
        .merge({
          score: gamePlayer.score + scoreEarned,
          correct: gamePlayer.correct + 1,
          streak: gamePlayer.streak + 1,
          bestStreak: Math.max(gamePlayer.bestStreak, gamePlayer.streak + 1),
        })
        .save()
    } else {
      await gamePlayer
        .merge({
          incorrect: gamePlayer.incorrect + 1,
          streak: 0,
        })
        .save()
    }

    return { correct: isCorrect, scoreEarned, responseMs, flags }
  }

  private async validateAnswer(
    round: Round,
    answerTrackId: number | null,
    answerText: string | null
  ): Promise<boolean> {
    if (!round.track) {
      await round.load('track')
    }
    const correctTrack = round.track

    if (answerTrackId !== null) {
      return answerTrackId === correctTrack.id
    }

    if (answerText) {
      const normalized = this.normalizeText(answerText)
      const correctTitle = this.normalizeText(correctTrack.title)
      const correctArtist = this.normalizeText(correctTrack.artist)
      return normalized === correctTitle || normalized.includes(correctTitle) || correctTitle.includes(normalized) || normalized === correctArtist
    }

    return false
  }

  private calculateScore(responseMs: number, streak: number, roundDurationMs: number): number {
    const speedRatio = Math.max(0, 1 - responseMs / roundDurationMs)
    const speedBonus = Math.floor(speedRatio * SPEED_BONUS_MAX)
    const base = MAX_SCORE_PER_ROUND - SPEED_BONUS_MAX + speedBonus
    const multiplierIndex = Math.min(streak, COMBO_MULTIPLIERS.length - 1)
    return Math.floor(base * COMBO_MULTIPLIERS[multiplierIndex])
  }

  private detectSuspiciousFlags(responseMs: number, isCorrect: boolean, player: GamePlayer): string[] {
    const flags: string[] = []
    if (isCorrect && responseMs < 300) flags.push('IMPOSSIBLE_RESPONSE_TIME')
    if (isCorrect && responseMs < 800) flags.push('VERY_FAST_RESPONSE')
    if (player.correct >= 5 && player.incorrect === 0) flags.push('SUSPICIOUS_ACCURACY')
    return flags
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
  }
}

export default new ScoreService()
