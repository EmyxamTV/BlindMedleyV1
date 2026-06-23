import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { router } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'
import type { InertiaProps } from '~/types'
import { createRealtimeUid } from '~/lib/realtime'

interface Choice {
  choiceToken: string
  trackId: number
  title: string
  artist: string
}

interface Round {
  roundNumber: number
  roundToken: string
  previewUrl: string | null
  coverUrl: string | null
  startsAt: number
  endsAt: number
  serverNow: number
  choices: Choice[]
  alreadyAnswered?: boolean
}

interface MyPlayer {
  id: number
  userId: number
  score: number
  streak: number
  correct: number
  incorrect: number
}

interface ScoreEntry {
  userId: number
  username: string
  score: number
  streak: number
  correct?: number
  incorrect?: number
}

interface HistoryTrack {
  roundNumber: number
  title: string
  artist: string
  coverUrl: string | null
}

interface AnswerPing {
  userId: number
  responseMs: number
  isCorrect?: boolean
}

interface AnswerProgress {
  userId: number
  titleFound: boolean
  artistFound: boolean
}

const VOLUME_STORAGE_KEY = 'blindmedley-game-volume'

function TrackLinks({ title, artist, compact = false }: { title: string; artist: string; compact?: boolean }) {
  const query = encodeURIComponent(`${title} ${artist}`)
  return (
    <div className={`track-links ${compact ? 'compact' : ''}`}>
      <a href={`https://open.spotify.com/search/${query}`} target="_blank" rel="noreferrer" aria-label="Ouvrir sur Spotify" title="Spotify">
        {compact ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5c4.8-1.4 9.6-.9 13.5 1.1M5.8 12c4.2-1.1 8.5-.6 12 1.1M6.7 15.3c3.4-.8 6.8-.4 9.5.9" /></svg> : 'Spotify'}
      </a>
      <a href={`https://www.deezer.com/search/${query}`} target="_blank" rel="noreferrer" aria-label="Ouvrir sur Deezer" title="Deezer">
        {compact ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h3v-5H3zm4 0h3V8H7zm4 0h3v-9h-3zm4 0h3v-6h-3zm4 0h2v-3h-2z" /></svg> : 'Deezer'}
      </a>
      <a href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer" aria-label="Ouvrir sur YouTube" title="YouTube">
        {compact ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12s0-4.1-.5-5.3c-.3-.7-.9-1.3-1.6-1.6C17.7 4.6 12 4.6 12 4.6s-5.7 0-6.9.5c-.7.3-1.3.9-1.6 1.6C3 7.9 3 12 3 12s0 4.1.5 5.3c.3.7.9 1.3 1.6 1.6 1.2.5 6.9.5 6.9.5s5.7 0 6.9-.5c.7-.3 1.3-.9 1.6-1.6.5-1.2.5-5.3.5-5.3Z" /><path d="m10 9 5 3-5 3Z" /></svg> : 'YouTube'}
      </a>
    </div>
  )
}

interface Game {
  id: number
  mode: string
  answerMode: 'choices' | 'text'
  answerTarget: 'title' | 'artist' | 'both' | 'separate'
  status: string
  playlistName: string
  roundCount: number
  roundDurationMs: number
  currentRound: number
  players: ScoreEntry[]
}

interface Props extends InertiaProps {
  game: Game
  myPlayer: MyPlayer
  round: Round | null
  history: HistoryTrack[]
  serverNow: number
}

function Timer({ endsAt, serverNow, durationMs, pings, players }: { endsAt: number; serverNow: number; durationMs: number; pings: AnswerPing[]; players: ScoreEntry[] }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const clockOffset = serverNow - Date.now()
    const update = () => {
      const r = Math.max(0, endsAt - (Date.now() + clockOffset))
      setRemaining(r)
      if (r <= 0) clearInterval(interval)
    }
    const interval = setInterval(update, 100)
    update()
    return () => clearInterval(interval)
  }, [endsAt, serverNow])

  const pct = Math.min(100, (remaining / durationMs) * 100)
  const secs = Math.ceil(remaining / 1000)
  const urgent = secs <= 5

  return (
    <div className={`timer ${urgent ? 'urgent' : ''}`}>
      <div className="timer-bar-wrap">
        <div className="timer-bar" style={{ width: `${pct}%` }} />
        {pings.map((ping) => (
          <span key={ping.userId} className={`answer-ping ${ping.isCorrect === false ? 'wrong' : ''}`} style={{ left: `${Math.min(98, Math.max(2, 100 - (ping.responseMs / durationMs) * 100))}%` }}>
            <span className="answer-ping-name">{players.find((player) => player.userId === ping.userId)?.username ?? 'Joueur'}</span>
            <i />
          </span>
        ))}
      </div>
      <span className="timer-secs">{secs}s</span>
    </div>
  )
}

function AudioPlayer({
  previewUrl,
  volume,
  onVolumeChange,
}: {
  previewUrl: string
  volume: number
  onVolumeChange: (value: number) => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setBlocked(false)
    setPlaying(false)
    audio.volume = volume / 100
    audio.play().catch(() => setBlocked(true))
  }, [previewUrl])

  function updateVolume(value: number) {
    onVolumeChange(value)
    if (audioRef.current) audioRef.current.volume = value / 100
  }

  const handleCardClick = () => {
    const audio = audioRef.current
    if (!audio || playing) return
    audio.play().catch(() => {})
  }

  return (
    <div
      className={`audio-card ${blocked ? 'needs-click' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: blocked ? 'pointer' : 'default' }}
    >
      <audio
        ref={audioRef}
        src={previewUrl}
        autoPlay
        onPlay={() => { setPlaying(true); setBlocked(false) }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className={`audio-wave ${playing ? '' : 'paused'}`}>
        <span /><span /><span /><span /><span /><span /><span />
      </div>
      <label className="volume-control" onClick={(event) => event.stopPropagation()}>
        <span aria-hidden="true">🔊</span>
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => updateVolume(Number(event.target.value))}
          style={{ '--volume': `${volume}%` } as CSSProperties}
        />
        <span className="volume-value">{volume}%</span>
      </label>
      {blocked && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
          Appuie ici pour lancer l'audio
        </p>
      )}
    </div>
  )
}

export default function Play({ game, myPlayer: initialMyPlayer, round, history: initialHistory, serverNow }: Props) {
  const [answered, setAnswered] = useState(round?.alreadyAnswered ?? false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; partial?: boolean; partialFound?: 'title' | 'artist' | null; scoreEarned: number } | null>(null)
  const [scores, setScores] = useState<ScoreEntry[]>(game.players)
  const [myPlayer, setMyPlayer] = useState(initialMyPlayer)
  const [currentRound, setCurrentRound] = useState<Round | null>(round)
  const [gameStatus, setGameStatus] = useState(game.status)
  const [revealed, setRevealed] = useState<{ title: string; artist: string } | null>(null)
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 75
    const stored = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY))
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 75
  })
  const [history, setHistory] = useState<HistoryTrack[]>(initialHistory)
  const [answerPings, setAnswerPings] = useState<AnswerPing[]>([])
  const [answerProgress, setAnswerProgress] = useState<Record<number, AnswerProgress>>({})
  const [textAnswer, setTextAnswer] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume))
  }, [volume])

  useEffect(() => {
    if (game.answerMode !== 'text' || !currentRound) return
    setTextAnswer('')
    const focusInput = () => textInputRef.current?.focus({ preventScroll: true })
    const timers = [50, 250, 600].map((delay) => window.setTimeout(focusInput, delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [currentRound?.roundNumber, game.answerMode, gameStatus])

  // Signaler le départ quand le joueur ferme/quitte la page
  useEffect(() => {
    const sendLeave = () => navigator.sendBeacon(`/game/${game.id}/leave`, '')
    window.addEventListener('beforeunload', sendLeave)
    window.addEventListener('pagehide', sendLeave)
    return () => {
      window.removeEventListener('beforeunload', sendLeave)
      window.removeEventListener('pagehide', sendLeave)
    }
  }, [game.id])

  // Fallback polling — tourne en permanence pour rattraper les SSE manqués
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/game/${game.id}/state`, { headers: { Accept: 'application/json' } })
      if (!res.ok) return
      const data = await res.json()
      if (data.scores) {
        const players = data.scores as ScoreEntry[]
        setScores(players)
        const me = players.find((player) => player.userId === initialMyPlayer.userId)
        if (me) setMyPlayer((previous) => ({ ...previous, ...me }))
      }
      if (data.answerPings) setAnswerPings(data.answerPings as AnswerPing[])
      if (data.answerProgress) {
        setAnswerProgress(Object.fromEntries((data.answerProgress as AnswerProgress[]).map((progress) => [progress.userId, progress])))
      }
      if (data.history) setHistory(data.history as HistoryTrack[])
      if (data.status === 'finished') {
        router.visit(`/game/${game.id}/results`)
        return
      }
      if (data.round) {
        const serverRound = data.round as Round
        // Nouveau round détecté (SSE manqué)
        if (!currentRound || serverRound.roundNumber > currentRound.roundNumber) {
          setCurrentRound(serverRound)
          setAnswered(false)
          setLastResult(null)
          setRevealed(null)
          setAnswerPings([])
          setAnswerProgress({})
          setGameStatus('active')
        } else if (serverRound.roundNumber === currentRound?.roundNumber) {
          setCurrentRound((round) => round ? { ...round, serverNow: data.serverNow } : round)
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [game.id, currentRound])

  useEffect(() => {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: createRealtimeUid,
    })
    const subscription = transmit.subscription(`game/${game.id}`)

    subscription.create().then(() => {
      subscription.onMessage<{ event: string } & Record<string, unknown>>((message) => {
        if (message.event === 'round_started') {
          const { event: _, ...roundData } = message
          setCurrentRound(roundData as unknown as Round)
          setAnswered(false)
          setLastResult(null)
          setRevealed(null)
          setAnswerPings([])
          setAnswerProgress({})
          setGameStatus('active')
        } else if (message.event === 'answer_submitted') {
          if (message.roundNumber === currentRound?.roundNumber) {
            setAnswerPings((current) => current.some((ping) => ping.userId === message.userId)
              ? current
              : [...current, { userId: message.userId as number, responseMs: message.responseMs as number, isCorrect: message.isCorrect as boolean }])
          }
        } else if (message.event === 'round_revealed') {
          const revealedTrack = {
            roundNumber: message.roundNumber as number,
            title: message.title as string,
            artist: message.artist as string,
            coverUrl: (message.coverUrl as string | null) ?? null,
          }
          setRevealed(revealedTrack)
          setHistory((current) => [revealedTrack, ...current.filter((track) => track.roundNumber !== revealedTrack.roundNumber)])
        } else if (message.event === 'scores_updated') {
          const players = message.players as ScoreEntry[]
          setScores(players)
          const me = players.find((p) => p.userId === initialMyPlayer.userId)
          if (me) {
            setMyPlayer((prev) => ({
              ...prev,
              score: me.score,
              streak: me.streak,
              correct: me.correct ?? prev.correct,
              incorrect: me.incorrect ?? prev.incorrect,
            }))
          }
        } else if (message.event === 'game_finished') {
          setGameStatus('finished')
          router.visit(`/game/${game.id}/results`)
        }
      })
    })

    return () => {
      subscription.delete()
    }
  }, [game.id])

  const handleAnswer = useCallback(
    async (choice: Choice | string) => {
      if (answered || !currentRound) return
      setAnswered(true)

      try {
        const res = await fetch(`/game/${game.id}/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
          },
          body: JSON.stringify({
            roundNumber: currentRound.roundNumber,
            answerTrackId: typeof choice === 'string' ? undefined : choice.trackId,
            answerText: typeof choice === 'string' ? choice : undefined,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setLastResult({ correct: data.correct, partial: data.partial, partialFound: data.partialFound, scoreEarned: data.scoreEarned })
          setTextAnswer('')
          if (game.answerTarget === 'separate' && (data.titleFound || data.artistFound)) {
            setAnswerProgress((current) => ({
              ...current,
              [initialMyPlayer.userId]: {
                userId: initialMyPlayer.userId,
                titleFound: Boolean(data.titleFound),
                artistFound: Boolean(data.artistFound),
              },
            }))
          }
          if (game.answerMode === 'text' && !data.correct) {
            setAnswered(false)
            window.setTimeout(() => textInputRef.current?.focus({ preventScroll: true }), 50)
          }
        } else if (message.event === 'answer_progress') {
          if (message.roundNumber === currentRound?.roundNumber) {
            const progress = {
              userId: message.userId as number,
              titleFound: Boolean(message.titleFound),
              artistFound: Boolean(message.artistFound),
            }
            setAnswerProgress((current) => ({ ...current, [progress.userId]: progress }))
          }
          if (data.correct) {
            setAnswerPings((current) => current.some((ping) => ping.userId === initialMyPlayer.userId)
              ? current
              : [...current, {
                  userId: initialMyPlayer.userId,
                  responseMs: Math.min(game.roundDurationMs, Math.max(0, Date.now() - currentRound.startsAt)),
                  isCorrect: true,
                }])
          }
          setMyPlayer((previous) => ({
            ...previous,
            score: previous.score + data.scoreEarned,
            streak: data.correct ? previous.streak + 1 : data.partial ? previous.streak : 0,
            correct: previous.correct + (data.correct ? 1 : 0),
            incorrect: previous.incorrect + (data.correct || data.partial ? 0 : 1),
          }))
          setScores((previous) => previous.map((player) => player.userId === initialMyPlayer.userId
            ? { ...player, score: player.score + data.scoreEarned, streak: data.correct ? player.streak + 1 : data.partial ? player.streak : 0 }
            : player))
        }
      } catch {
        // Ignorer les erreurs réseau
      }
    },
    [answered, currentRound, game.id, game.roundDurationMs, initialMyPlayer.userId]
  )

  if (!currentRound || gameStatus === 'waiting' || gameStatus === 'starting') {
    return (
      <div className="play-waiting">
        <div className="spinner-large" />
        <p>Préparation du round...</p>
      </div>
    )
  }

  return (
    <div className="play-layout">
      {/* Sidebar scores */}
      <aside className="play-sidebar">
        <h3>Classement</h3>
        {scores
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <div key={p.userId} className={`score-row ${p.userId === myPlayer.userId ? 'me' : ''}`}>
              <span className="score-rank">#{i + 1}</span>
              <span className="score-player"><span className="score-name">{p.username}</span>{game.answerTarget === 'separate' && answerProgress[p.userId] && <span className="answer-progress-tags">{answerProgress[p.userId].titleFound && <span>Titre</span>}{answerProgress[p.userId].artistFound && <span>Artiste</span>}</span>}</span>
              {p.streak >= 2 && <span className="streak-badge">🔥{p.streak}</span>}
              <span className="score-pts">{p.score}</span>
            </div>
          ))}
        {history.length > 0 && (
          <section className="track-history">
            <h3>Déjà joués</h3>
            {history.map((track) => (
              <div className="history-track" key={track.roundNumber}>
                {track.coverUrl ? <img src={track.coverUrl} alt="" /> : <span className="history-cover">♪</span>}
                <div><strong>{track.title}</strong><span>{track.artist}</span><TrackLinks title={track.title} artist={track.artist} compact /></div>
              </div>
            ))}
          </section>
        )}
      </aside>

      {/* Zone de jeu principale */}
      <main className="play-main">
        <div className="round-header">
          <span className="round-num">
            Round {currentRound.roundNumber}/{game.roundCount}
          </span>
          <Timer endsAt={currentRound.endsAt} serverNow={currentRound.serverNow ?? serverNow} durationMs={game.roundDurationMs} pings={answerPings} players={scores} />
          <div className="my-score-mini">
            {myPlayer.score} pts
            {myPlayer.streak >= 2 && <span className="combo">x{myPlayer.streak}</span>}
          </div>
        </div>

        {game.answerMode === 'text' && (
          <form className="text-answer-form text-answer-static" onSubmit={(event) => { event.preventDefault(); if (textAnswer.trim()) void handleAnswer(textAnswer.trim()) }}>
            <span className="text-answer-icon">⌕</span>
            <input ref={textInputRef} id="text-answer" value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} disabled={answered} placeholder={game.answerTarget === 'title' ? 'Écris le titre...' : game.answerTarget === 'artist' ? 'Écris l’artiste...' : game.answerTarget === 'separate' ? 'Titre ou artiste...' : 'Titre et artiste...'} autoComplete="off" autoFocus />
            <button className="btn btn-primary" disabled={answered || !textAnswer.trim()}>Envoyer</button>
          </form>
        )}

        {currentRound.previewUrl ? (
          <AudioPlayer
            key={currentRound.previewUrl}
            previewUrl={currentRound.previewUrl}
            volume={volume}
            onVolumeChange={setVolume}
          />
        ) : (
          <div className="audio-card">
            <span style={{ fontSize: '2rem' }}>🎵</span>
            <span className="audio-hint">Pas d'extrait disponible — devine au titre</span>
          </div>
        )}

        {/* Révélation après le round */}
        {revealed && (
          <div className="round-reveal">
            <span className="reveal-label">C'était :</span>
            <span className="reveal-title">{revealed.title}</span>
            <span className="reveal-artist">{revealed.artist}</span>
            <TrackLinks title={revealed.title} artist={revealed.artist} />
          </div>
        )}

        {/* Résultat de la réponse */}
        {lastResult && (
          <div className={`answer-result ${lastResult.correct || lastResult.partial ? 'correct' : 'incorrect'}`}>
            {lastResult.correct ? (
              <>
                <span className="result-icon">✓</span>
                <span>Bonne réponse ! +{lastResult.scoreEarned} pts</span>
              </>
            ) : lastResult.partial ? (
              <>
                <span className="result-icon">✓</span>
                <span>{lastResult.partialFound === 'title' ? 'Titre trouvé' : 'Artiste trouvé'} ! +{lastResult.scoreEarned} pts</span>
              </>
            ) : (
              <>
                <span className="result-icon">✗</span>
                <span>Mauvaise réponse</span>
              </>
            )}
          </div>
        )}

        {/* Choix QCM */}
        {game.answerMode === 'text' ? (
          <form className="text-answer-form" onSubmit={(event) => { event.preventDefault(); if (textAnswer.trim()) void handleAnswer(textAnswer.trim()) }}>
            <label htmlFor="text-answer">Titre ou artiste ?</label>
            <div><input id="text-answer" value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} disabled={answered} placeholder="Écris ta réponse..." autoComplete="off" autoFocus /><button className="btn btn-primary" disabled={answered || !textAnswer.trim()}>Valider</button></div>
          </form>
        ) : (
          <div className="choices-grid">
            {currentRound.choices.map((choice) => (
              <button key={choice.choiceToken} className={`choice-btn ${answered ? 'disabled' : ''}`} onClick={() => handleAnswer(choice)} disabled={answered}>
                <span className="choice-title">{choice.title}</span><span className="choice-artist">{choice.artist}</span>
              </button>
            ))}
          </div>
        )}

        {answered && !lastResult && (
          <p className="answered-waiting">Réponse enregistrée. En attente du résultat...</p>
        )}
      </main>
    </div>
  )
}
