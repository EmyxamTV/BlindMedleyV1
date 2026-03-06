import { Link, Form } from '@adonisjs/inertia/react'
import type { InertiaProps } from '~/types'

interface Props extends InertiaProps {
  stats: { totalUsers: number; totalGames: number; activePlaylists: number }
  recentGames: { id: number; mode: string; status: string; playlistName: string; createdAt: string }[]
}

export default function AdminDashboard({ stats, recentGames }: Props) {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administration</h1>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link">Dashboard</Link>
          <Link route="admin.users" className="admin-nav-link">Utilisateurs</Link>
          <Link route="admin.playlists" className="admin-nav-link">Playlists</Link>
        </nav>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalUsers}</span>
          <span className="admin-stat-label">Utilisateurs</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalGames}</span>
          <span className="admin-stat-label">Parties jouées</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.activePlaylists}</span>
          <span className="admin-stat-label">Playlists actives</span>
        </div>
      </div>

      <section className="admin-section">
        <h2>Parties récentes</h2>
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Mode</th><th>Playlist</th><th>Statut</th><th>Créée</th></tr>
          </thead>
          <tbody>
            {recentGames.map((g) => (
              <tr key={g.id}>
                <td>#{g.id}</td>
                <td><span className={`mode-badge mode-${g.mode}`}>{g.mode}</span></td>
                <td>{g.playlistName}</td>
                <td><span className={`status-badge status-${g.status}`}>{g.status}</span></td>
                <td>{new Date(g.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
