import { useCallback, useEffect, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'
import type { InertiaProps } from '~/types'

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

interface Game {
  id: number
  mode: string
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
  serverNow: number
}

function Timer({ endsAt, serverNow }: { endsAt: number; serverNow: number }) {
  const clockOffset = useRef(serverNow - Date.now())
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - (Date.now() + clockOffset.current)))

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, endsAt - (Date.now() + clockOffset.current))
      setRemaining(r)
      if (r <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [endsAt])

  const pct = Math.min(100, (remaining / (endsAt - (endsAt - 30000))) * 100)
  const secs = Math.ceil(remaining / 1000)
  const urgent = secs <= 5

  return (
    <div className={`timer ${urgent ? 'urgent' : ''}`}>
      <div className="timer-bar-wrap">
        <div className="timer-bar" style={{ width: `${pct}%` }} />
      </div>
      <span className="timer-secs">{secs}s</span>
    </div>
  )
}

function AudioPlayer({ previewUrl }: { previewUrl: string; startsAt: number; serverNow: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setBlocked(false)
    setPlaying(false)
    audio.play().catch(() => setBlocked(true))
  }, [previewUrl])

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
      {blocked && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
          Appuie ici pour lancer l'audio
        </p>
      )}
    </div>
  )
}

export default function Play({ game, myPlayer: initialMyPlayer, round, serverNow }: Props) {
  const [answered, setAnswered] = useState(round?.alreadyAnswered ?? false)
  const [lastResult, setLastResult] = useState<{ correct: boolean; scoreEarned: number } | null>(null)
  const [scores, setScores] = useState<ScoreEntry[]>(game.players)
  const [myPlayer, setMyPlayer] = useState(initialMyPlayer)
  const [currentRound, setCurrentRound] = useState<Round | null>(round)
  const [gameStatus, setGameStatus] = useState(game.status)
  const [revealed, setRevealed] = useState<{ title: string; artist: string } | null>(null)

  // Fallback polling — tourne en permanence pour rattraper les SSE manqués
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/game/${game.id}/state`, { headers: { Accept: 'application/json' } })
      if (!res.ok) return
      const data = await res.json()
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
          setGameStatus('active')
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [game.id, currentRound])

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`game/${game.id}`)

    subscription.create().then(() => {
      subscription.onMessage<{ event: string } & Record<string, unknown>>((message) => {
        if (message.event === 'round_started') {
          const { event: _, ...roundData } = message
          setCurrentRound(roundData as unknown as Round)
          setAnswered(false)
          setLastResult(null)
          setRevealed(null)
          setGameStatus('active')
        } else if (message.event === 'round_revealed') {
          setRevealed({ title: message.title as string, artist: message.artist as string })
        } else if (message.event === 'scores_updated') {
          const players = message.players as ScoreEntry[]
          setScores(players)
          const me = players.find((p) => p.userId === initialMyPlayer.id)
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
    async (choice: Choice) => {
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
            answerTrackId: choice.trackId,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setLastResult({ correct: data.correct, scoreEarned: data.scoreEarned })
        }
      } catch {
        // Ignorer les erreurs réseau
      }
    },
    [answered, currentRound, game.id]
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
            <div key={p.userId} className={`score-row ${p.userId === myPlayer.id ? 'me' : ''}`}>
              <span className="score-rank">#{i + 1}</span>
              <span className="score-name">{p.username}</span>
              {p.streak >= 2 && <span className="streak-badge">🔥{p.streak}</span>}
              <span className="score-pts">{p.score}</span>
            </div>
          ))}
      </aside>

      {/* Zone de jeu principale */}
      <main className="play-main">
        <div className="round-header">
          <span className="round-num">
            Round {currentRound.roundNumber}/{game.roundCount}
          </span>
          <Timer endsAt={currentRound.endsAt} serverNow={serverNow} />
          <div className="my-score-mini">
            {myPlayer.score} pts
            {myPlayer.streak >= 2 && <span className="combo">x{myPlayer.streak}</span>}
          </div>
        </div>

        {currentRound.previewUrl ? (
          <AudioPlayer
            key={currentRound.previewUrl}
            previewUrl={currentRound.previewUrl}
            startsAt={currentRound.startsAt}
            serverNow={currentRound.serverNow ?? serverNow}
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
          </div>
        )}

        {/* Résultat de la réponse */}
        {lastResult && (
          <div className={`answer-result ${lastResult.correct ? 'correct' : 'incorrect'}`}>
            {lastResult.correct ? (
              <>
                <span className="result-icon">✓</span>
                <span>Bonne réponse ! +{lastResult.scoreEarned} pts</span>
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
        <div className="choices-grid">
          {currentRound.choices.map((choice) => (
            <button
              key={choice.choiceToken}
              className={`choice-btn ${answered ? 'disabled' : ''}`}
              onClick={() => handleAnswer(choice)}
              disabled={answered}
            >
              <span className="choice-title">{choice.title}</span>
              <span className="choice-artist">{choice.artist}</span>
            </button>
          ))}
        </div>

        {answered && !lastResult && (
          <p className="answered-waiting">Réponse enregistrée. En attente du résultat...</p>
        )}
      </main>
    </div>
  )
}
