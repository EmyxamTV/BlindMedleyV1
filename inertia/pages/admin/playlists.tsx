import { useState } from "react";
import { Link, Form } from "@adonisjs/inertia/react";
import type { InertiaProps } from "~/types";

interface AdminPlaylist {
  id: number;
  name: string;
  spotifyId: string | null;
  genre: string | null;
  difficulty: number;
  trackCount: number;
  isActive: boolean;
  lastSyncedAt: string | null;
}

interface Props extends InertiaProps {
  playlists: AdminPlaylist[];
}

function DiffDots({ level }: { level: number }) {
  return (
    <div className="diff-dots">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`diff-dot ${i < level ? "on" : ""}`} />
      ))}
    </div>
  );
}

export default function AdminPlaylists({ playlists }: Props) {
  const [importUrl, setImportUrl] = useState("");

  const active = playlists.filter((p) => p.isActive).length;

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Playlists Spotify</h1>
          <p className="admin-sub">
            {active} actives sur {playlists.length}
          </p>
        </div>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link route="admin.users" className="admin-nav-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Utilisateurs
          </Link>
          <Link route="admin.playlists" className="admin-nav-link active">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
            </svg>
            Playlists
          </Link>
        </nav>
      </div>

      {/* Import */}
      <section className="admin-section">
        <h2>Importer depuis Spotify</h2>
        <Form route="admin.playlists.import">
          {({ errors }) => (
            <div className="import-row">
              <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <label>URL de la playlist Spotify</label>
                <input
                  type="text"
                  name="spotify_url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                {errors.spotify_url && <div className="field-error">{errors.spotify_url}</div>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={!importUrl.trim()}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ marginRight: "0.4rem" }}
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
                Importer
              </button>
            </div>
          )}
        </Form>
      </section>

      {/* List */}
      <section className="admin-section">
        <h2>Playlists ({playlists.length})</h2>
        {playlists.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">🎵</span>
            <p>Aucune playlist importée. Colle une URL Spotify ci-dessus.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Playlist</th>
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
                  <tr key={p.id} className={!p.isActive ? "row-inactive" : ""}>
                    <td>
                      <span className="pl-table-name">{p.name}</span>
                    </td>
                    <td>
                      {p.genre ? (
                        <span className="pl-genre">{p.genre}</span>
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <DiffDots level={p.difficulty} />
                    </td>
                    <td>{p.trackCount}</td>
                    <td>
                      <span
                        className={`status-badge ${p.isActive ? "status-active" : "status-inactive"}`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="td-date">
                      {p.lastSyncedAt ? (
                        new Date(p.lastSyncedAt).toLocaleDateString("fr-FR")
                      ) : (
                        <span style={{ color: "var(--text-3)" }}>Jamais</span>
                      )}
                    </td>
                    <td>
                      <Form route="admin.playlists.toggle" routeParams={{ id: p.id }}>
                        {() => (
                          <button
                            type="submit"
                            className={`btn-sm ${p.isActive ? "btn-warn" : "btn-success"}`}
                          >
                            {p.isActive ? "Désactiver" : "Activer"}
                          </button>
                        )}
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
