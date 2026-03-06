import { useState } from 'react'
import { Link, Form } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'

interface AdminPlaylist {
  id: number
  name: string
  spotifyId: string | null
  genre: string | null
  difficulty: number
  trackCount: number
  isActive: boolean
  lastSyncedAt: string | null
}

interface Props extends InertiaProps {
  playlists: AdminPlaylist[]
}

export default function AdminPlaylists({ playlists }: Props) {
  const [importUrl, setImportUrl] = useState('')

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Playlists Spotify</h1>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link">Dashboard</Link>
          <Link route="admin.users" className="admin-nav-link">Utilisateurs</Link>
          <Link route="admin.playlists" className="admin-nav-link active">Playlists</Link>
        </nav>
      </div>

      <section className="admin-section">
        <h2>Importer une playlist Spotify</h2>
        <Form route="admin.playlists.import" method="post" className="import-form">
          {({ errors }) => (
            <>
              <input
                type="text"
                name="spotify_url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
              />
              {errors.spotify_url && <div className="field-error">{errors.spotify_url}</div>}
              <button type="submit" className="btn btn-primary" disabled={!importUrl.trim()}>
                Importer
              </button>
            </>
          )}
        </Form>
      </section>

      <section className="admin-section">
        <h2>Playlists ({playlists.length})</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Genre</th>
              <th>Difficulté</th>
              <th>Titres</th>
              <th>Statut</th>
              <th>Sync</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((p) => (
              <tr key={p.id} className={!p.isActive ? 'inactive-row' : ''}>
                <td><strong>{p.name}</strong></td>
                <td>{p.genre ?? '—'}</td>
                <td>{'★'.repeat(p.difficulty)}{'☆'.repeat(5 - p.difficulty)}</td>
                <td>{p.trackCount}</td>
                <td>
                  <span className={`status-badge ${p.isActive ? 'status-active' : 'status-inactive'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {p.lastSyncedAt
                    ? new Date(p.lastSyncedAt).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </td>
                <td>
                  <Form route="admin.playlists.toggle" routeParams={{ id: p.id }} method="post">
                    {() => (
                      <button type="submit" className={`btn-sm ${p.isActive ? 'btn-warn' : 'btn-success'}`}>
                        {p.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
