import { useState } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import type { InertiaProps } from '~/types'

interface Playlist {
  id: number
  name: string
  trackCount: number
  genre: string | null
  difficulty: number
}

interface PublicGame {
  id: number
  code: string | null
  mode: string
  playlistName: string
  hostUsername: string
  playerCount: number
  maxPlayers: number
  difficulty: number
  createdAt: string
}

interface Props extends InertiaProps {
  playlists: Playlist[]
  publicGames: PublicGame[]
  myActiveGameId: number | null
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="difficulty-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < level ? 'star-on' : 'star-off'}>
          ★
        </span>
      ))}
    </span>
  )
}

export default function GameIndex({ playlists, publicGames, myActiveGameId }: Props) {
  const [tab, setTab] = useState<'create' | 'join' | 'public'>('create')
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'solo' | 'public' | 'private'>('solo')

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    if (joinCode.trim()) {
      router.post('/game/0/join', { code: joinCode.toUpperCase() })
    }
  }

  return (
    <div className="game-index">
      <div className="game-index-header">
        <h1>Jouer</h1>
        {myActiveGameId && (
          <Link route="game.play" routeParams={{ id: myActiveGameId }} className="btn btn-primary">
            Reprendre ma partie →
          </Link>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
          Créer une partie
        </button>
        <button className={`tab ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
          Rejoindre avec un code
        </button>
        <button className={`tab ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
          Parties publiques ({publicGames.length})
        </button>
      </div>

      {/* Onglet Créer */}
      {tab === 'create' && (
        <Form route="game.create" method="post" className="create-form">
          {({ errors }) => (
            <>
              <div className="form-section">
                <h3>Mode de jeu</h3>
                <div className="mode-selector">
                  {(['solo', 'public', 'private'] as const).map((m) => (
                    <label key={m} className="mode-option">
                      <input
                        type="radio"
                        name="mode"
                        value={m}
                        defaultChecked={m === 'solo'}
                        onChange={() => setMode(m)}
                      />
                      <span className="mode-label">
                        {m === 'solo' && 'Solo'}
                        {m === 'public' && 'Public'}
                        {m === 'private' && 'Privé'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Playlist</h3>
                {playlists.length === 0 ? (
                  <p className="empty-state">Aucune playlist disponible. Un admin doit en importer via Spotify.</p>
                ) : (
                  <div className="playlist-grid">
                    {playlists.map((p) => (
                      <label
                        key={p.id}
                        className={`playlist-card ${selectedPlaylist === p.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPlaylist(p.id)}
                      >
                        <input type="radio" name="playlistId" value={p.id} required />
                        <div className="playlist-card-body">
                          <strong>{p.name}</strong>
                          <span>{p.trackCount} titres</span>
                          {p.genre && <span className="genre-tag">{p.genre}</span>}
                          <DifficultyStars level={p.difficulty} />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.playlistId && <div className="field-error">{errors.playlistId}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de rounds</label>
                  <select name="roundCount" defaultValue="10">
                    <option value="5">5 rounds</option>
                    <option value="10">10 rounds</option>
                    <option value="15">15 rounds</option>
                    <option value="20">20 rounds</option>
                  </select>
                </div>
                {mode !== 'solo' && (
                  <div className="form-group">
                    <label>Joueurs max</label>
                    <select name="maxPlayers" defaultValue="8">
                      {[2, 4, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>{n} joueurs</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Difficulté</label>
                  <select name="difficulty" defaultValue="2">
                    <option value="1">Facile</option>
                    <option value="2">Normal</option>
                    <option value="3">Difficile</option>
                    <option value="4">Expert</option>
                    <option value="5">Légendaire</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={playlists.length === 0}>
                Créer la partie
              </button>
            </>
          )}
        </Form>
      )}

      {/* Onglet Code */}
      {tab === 'join' && (
        <div className="join-form-wrap">
          <form className="join-form" onSubmit={handleJoinCode}>
            <label>Code de la partie</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="EX: A1B2C3"
              maxLength={8}
              className="code-input"
            />
            <button type="submit" className="btn btn-primary btn-lg" disabled={!joinCode.trim()}>
              Rejoindre
            </button>
          </form>
        </div>
      )}

      {/* Onglet Public */}
      {tab === 'public' && (
        <div className="public-games">
          {publicGames.length === 0 ? (
            <p className="empty-state">Aucune partie publique en attente. Crée-en une !</p>
          ) : (
            publicGames.map((g) => (
              <div key={g.id} className="public-game-card">
                <div className="pgc-info">
                  <strong>{g.playlistName}</strong>
                  <span className="pgc-host">par {g.hostUsername}</span>
                  <DifficultyStars level={g.difficulty} />
                </div>
                <div className="pgc-meta">
                  <span className="pgc-players">
                    {g.playerCount}/{g.maxPlayers} joueurs
                  </span>
                </div>
                <Form route="game.join" routeParams={{ id: g.id }} method="post">
                  {() => <button type="submit" className="btn btn-primary">Rejoindre</button>}
                </Form>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
