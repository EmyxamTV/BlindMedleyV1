import { useEffect, useState } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'
import type { InertiaProps } from '~/types'

interface Player {
  id: number
  userId: number
  username: string
  avatarUrl: string | null
  score: number
  streak: number
  isConnected: boolean
}

interface Game {
  id: number
  code: string | null
  mode: string
  status: string
  playlistName: string
  difficulty: number
  maxPlayers: number
  roundCount: number
  roundDurationMs: number
  currentRound: number
  hostId: number | null
  players: Player[]
}

interface Props extends InertiaProps {
  game: Game
  isHost: boolean
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

function unlockAudio() {
  const s = new Audio(SILENT_WAV)
  s.play().catch(() => {})
}

export default function Lobby({ game, isHost, user }: Props) {
  const [players, setPlayers] = useState<Player[]>(game.players)

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`game/${game.id}`)

    subscription.create().then(() => {
      subscription.onMessage<{ event: string }>((message) => {
        if (message.event === 'game_starting') {
          unlockAudio()
          router.visit(`/game/${game.id}/play`)
        }
      })
    })

    // Fallback polling pour synchroniser la liste des joueurs (nouveaux arrivants)
    const interval = setInterval(() => {
      router.reload({ only: ['game'] })
    }, 5000)

    return () => {
      subscription.delete()
      clearInterval(interval)
    }
  }, [game.id])

  // Sync players si Inertia reload
  useEffect(() => {
    setPlayers(game.players)
  }, [game.players])

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <div>
          <h1>{game.playlistName}</h1>
          <div className="lobby-meta">
            <span className={`mode-badge mode-${game.mode}`}>{game.mode}</span>
            <span>{game.roundCount} rounds</span>
            <span>{game.roundDurationMs / 1000}s par round</span>
          </div>
        </div>
        {game.code && (
          <div className="lobby-code">
            <span className="code-label">Code d'invitation</span>
            <span className="code-value">{game.code}</span>
          </div>
        )}
      </div>

      <div className="lobby-body">
        <div className="players-list">
          <h3>
            Joueurs ({players.length}/{game.maxPlayers})
          </h3>
          {players.map((p) => (
            <div key={p.id} className={`player-row ${!p.isConnected ? 'disconnected' : ''}`}>
              <div className="player-avatar-sm">
                {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : <span>{p.username[0].toUpperCase()}</span>}
              </div>
              <span className="player-name">{p.username}</span>
              {p.userId === game.hostId && <span className="host-badge">Hôte</span>}
              {user && p.userId === user.id && <span className="you-badge">Vous</span>}
            </div>
          ))}
          {Array.from({ length: game.maxPlayers - players.length }, (_, i) => (
            <div key={`empty-${i}`} className="player-row empty">
              <div className="player-avatar-sm empty" />
              <span className="player-name muted">En attente...</span>
            </div>
          ))}
        </div>

        <div className="lobby-actions">
          {isHost ? (
            <Form route="game.start" routeParams={{ id: game.id }} method="post">
              {() => (
                <button
                  type="submit"
                  className="btn btn-primary btn-xl"
                  disabled={game.mode !== 'solo' && players.length < 2}
                  onClick={unlockAudio}
                >
                  Démarrer la partie
                </button>
              )}
            </Form>
          ) : (
            <div className="waiting-message">
              <div className="spinner" />
              <p>En attente que l'hôte démarre...</p>
            </div>
          )}
          <Link route="game.index" className="btn btn-ghost">
            Quitter
          </Link>
        </div>
      </div>
    </div>
  )
}
