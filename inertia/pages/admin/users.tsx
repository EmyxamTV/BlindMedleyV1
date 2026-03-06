import { useState } from 'react'
import { Link, Form } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import type { InertiaProps } from '~/types'

interface AdminUser {
  id: number
  email: string
  fullName: string | null
  username: string | undefined
  role: string
  status: string
  createdAt: string
}

interface Meta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

interface Props extends InertiaProps {
  users: AdminUser[]
  meta: Meta
  search: string
  statusFilter: string
}

export default function AdminUsers({ users, meta, search, statusFilter }: Props) {
  const [q, setQ] = useState(search)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.get('/admin/users', { search: q, status: statusFilter })
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Utilisateurs</h1>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link">Dashboard</Link>
          <Link route="admin.users" className="admin-nav-link active">Utilisateurs</Link>
          <Link route="admin.playlists" className="admin-nav-link">Playlists</Link>
        </nav>
      </div>

      <div className="admin-filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par email ou pseudo..."
          />
          <button type="submit" className="btn btn-primary">Rechercher</button>
        </form>
        <div className="status-filters">
          {['', 'active', 'suspended', 'banned'].map((s) => (
            <button
              key={s || 'all'}
              className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => router.get('/admin/users', { search, status: s })}
            >
              {s || 'Tous'}
            </button>
          ))}
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Inscrit le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <div>
                  <strong>{u.username ?? u.fullName ?? '—'}</strong>
                  <span className="muted">{u.email}</span>
                </div>
              </td>
              <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
              <td><span className={`status-badge status-${u.status}`}>{u.status}</span></td>
              <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
              <td>
                <div className="action-btns">
                  {u.status === 'active' && (
                    <>
                      <Form route="admin.suspend" routeParams={{ id: u.id }} method="post">
                        {() => <button type="submit" className="btn-sm btn-warn">Suspendre 24h</button>}
                      </Form>
                      <Form route="admin.ban" routeParams={{ id: u.id }} method="post">
                        {() => <button type="submit" className="btn-sm btn-danger">Bannir</button>}
                      </Form>
                    </>
                  )}
                  {u.status !== 'active' && (
                    <Form route="admin.unban" routeParams={{ id: u.id }} method="post">
                      {() => <button type="submit" className="btn-sm btn-success">Débannir</button>}
                    </Form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <span>{meta.total} utilisateurs — Page {meta.currentPage}/{meta.lastPage}</span>
        {meta.currentPage > 1 && (
          <button onClick={() => router.get('/admin/users', { search, status: statusFilter, page: meta.currentPage - 1 })} className="btn btn-ghost">
            ← Précédent
          </button>
        )}
        {meta.currentPage < meta.lastPage && (
          <button onClick={() => router.get('/admin/users', { search, status: statusFilter, page: meta.currentPage + 1 })} className="btn btn-ghost">
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}
