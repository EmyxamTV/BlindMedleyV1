import { Link } from "@adonisjs/inertia/react";
import type { InertiaProps } from "~/types";

interface Props extends InertiaProps {
  stats: { totalUsers: number; totalGames: number; activePlaylists: number };
  recentGames: {
    id: number;
    mode: string;
    status: string;
    playlistName: string;
    createdAt: string;
  }[];
}

const STAT_ICONS = {
  users: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  games: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  playlists: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
};

function statusLabel(s: string) {
  if (s === "waiting") return "En attente";
  if (s === "playing") return "En cours";
  if (s === "finished") return "Terminée";
  return s;
}

export default function AdminDashboard({ stats, recentGames }: Props) {
  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Administration</h1>
          <p className="admin-sub">Vue d'ensemble de la plateforme</p>
        </div>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link active">
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
          <Link route="admin.playlists" className="admin-nav-link">
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

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.users}</div>
          <span className="admin-stat-val">{stats.totalUsers}</span>
          <span className="admin-stat-lbl">Utilisateurs</span>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.games}</div>
          <span className="admin-stat-val">{stats.totalGames}</span>
          <span className="admin-stat-lbl">Parties jouées</span>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.playlists}</div>
          <span className="admin-stat-val">{stats.activePlaylists}</span>
          <span className="admin-stat-lbl">Playlists actives</span>
        </div>
      </div>

      <section className="admin-section">
        <h2>Parties récentes</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mode</th>
                <th>Playlist</th>
                <th>Statut</th>
                <th>Créée</th>
              </tr>
            </thead>
            <tbody>
              {recentGames.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", color: "var(--text-3)", padding: "2rem" }}
                  >
                    Aucune partie récente
                  </td>
                </tr>
              ) : (
                recentGames.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className="admin-id">#{g.id}</span>
                    </td>
                    <td>
                      <span className={`mode-badge mode-${g.mode}`}>{g.mode}</span>
                    </td>
                    <td>{g.playlistName}</td>
                    <td>
                      <span className={`status-badge status-${g.status}`}>
                        {statusLabel(g.status)}
                      </span>
                    </td>
                    <td className="td-date">{new Date(g.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
