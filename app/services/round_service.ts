import Round from '#models/round'
import TrackCache from '#models/track_cache'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export class RoundService {
  async pregenerateRounds(gameId: number, playlistId: number, count: number): Promise<Round[]> {
    // D'abord essayer avec preview, sinon prendre tous les tracks disponibles
    let tracks = await TrackCache.query()
      .whereHas('playlists', (q) => q.where('playlists.id', playlistId))
      .where('has_preview', true)
      .whereNotNull('preview_url')
      .orderByRaw('RANDOM()')
      .limit(count)

    if (tracks.length < count) {
      // Compléter (sans remplacer) avec des tracks sans preview — mode titre uniquement
      const usedIds = tracks.map((t) => t.id)
      const extra = await TrackCache.query()
        .whereHas('playlists', (q) => q.where('playlists.id', playlistId))
        .whereNotIn('id', usedIds.length > 0 ? usedIds : [0])
        .where('has_preview', true)
        .whereNotNull('preview_url')
        .orderByRaw('RANDOM()')
        .limit(count - tracks.length)
      tracks = [...tracks, ...extra]
    }

    if (tracks.length < count) {
      throw new Error(
        `Pas assez de tracks dans cette playlist (${tracks.length}/${count}). Importez une playlist avec plus de titres.`
      )
    }

    const rounds: Round[] = []

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const distractors = await this.generateDistractors(
        track.id,
        playlistId,
        tracks.map((t) => t.id)
      )

      const round = await Round.create({
        gameId,
        trackId: track.id,
        roundNumber: i + 1,
        roundToken: crypto.randomBytes(32).toString('hex'),
        distractors,
      })

      rounds.push(round)
    }

    return rounds
  }

  async startRound(round: Round, durationMs: number): Promise<Round> {
    const now = DateTime.now()
    return round
      .merge({
        startsAt: now,
        endsAt: now.plus({ milliseconds: durationMs }),
      })
      .save()
  }

  async revealRound(round: Round): Promise<Round> {
    return round.merge({ revealedAt: DateTime.now() }).save()
  }

  // Construire le payload envoyé au client — JAMAIS le titre ou l'ID réel
  async buildClientPayload(round: Round, serverNow: number, answerMode: 'choices' | 'text' = 'choices') {
    if (!round.track) await round.load('track')

    // Charger les distractors (sans révéler le bon)
    const allIds = [...round.distractors, round.trackId]
    const shuffled = this.shuffle(allIds)

    const tracks = await TrackCache.query().whereIn('id', allIds)
    const trackMap = Object.fromEntries(tracks.map((t) => [t.id, t]))

    const choices = shuffled.map((id) => ({
      choiceToken: crypto.createHash('sha256').update(`${round.roundToken}:${id}`).digest('hex').substring(0, 16),
      trackId: id, // Envoyé pour référence interne (le client ne peut pas tricher car le score est côté serveur)
      title: trackMap[id]?.title ?? 'Inconnu',
      artist: trackMap[id]?.artist ?? '',
    }))

    return {
      roundNumber: round.roundNumber,
      roundToken: round.roundToken,
      previewUrl: round.track.previewUrl ? `/audio/preview?trackId=${round.trackId}` : null,
      coverUrl: round.track.coverUrl, // Révéler la cover est OK pour l'ambiance
      startsAt: round.startsAt?.toMillis() ?? serverNow,
      endsAt: round.endsAt?.toMillis() ?? serverNow + 30000,
      serverNow,
      choices: answerMode === 'choices' ? choices : [],
    }
  }

  // Payload de révélation (après la fin du round)
  buildRevealPayload(round: Round) {
    if (!round.track) throw new Error('Track non chargée')
    return {
      roundNumber: round.roundNumber,
      correctTrackId: round.trackId,
      title: round.track.title,
      artist: round.track.artist,
      coverUrl: round.track.coverUrl,
      previewUrl: round.track.previewUrl,
    }
  }

  private async generateDistractors(
    correctTrackId: number,
    playlistId: number,
    usedIds: number[]
  ): Promise<number[]> {
    const distractors = await TrackCache.query()
      .whereHas('playlists', (q) => q.where('playlists.id', playlistId))
      .whereNotIn('id', usedIds)
      .orderByRaw('RANDOM()')
      .limit(3)
      .select('id')

    // Si pas assez, prendre n'importe quelles tracks
    if (distractors.length < 3) {
      const extra = await TrackCache.query()
        .whereNot('id', correctTrackId)
        .whereNotIn('id', distractors.map((d) => d.id))
        .orderByRaw('RANDOM()')
        .limit(3 - distractors.length)
        .select('id')
      distractors.push(...extra)
    }

    return distractors.map((t) => t.id)
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

export default new RoundService()
