import { useState } from "react";
import { Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface PlaylistRow extends Record<string, JSONDataTypes> {
  id: number;
  name: string;
  description: string | null;
  genre: string | null;
  decade: string | null;
  difficulty: number;
  trackCount: number;
  visibility: "public" | "private";
  canEdit: boolean;
  isOwner: boolean;
}

interface Meta extends Record<string, JSONDataTypes> {
  total: number;
}

interface Props extends InertiaProps {
  playlists: PlaylistRow[];
  meta: Meta;
  search: string;
  filter: "all" | "public" | "mine" | "shared";
}

const FILTERS = [
  ["all", "Toutes"],
  ["public", "Publiques"],
  ["mine", "Mes privées"],
  ["shared", "Partagées"],
] as const;

export default function PlaylistIndex({ playlists, meta, search, filter }: Props) {
  const [q, setQ] = useState(search);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.get("/playlists", { search: q, filter });
  }

  function setFilter(next: Props["filter"]) {
    router.get("/playlists", { search: q, filter: next });
  }

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Playlists</h1>
          <p className="admin-sub">{meta.total} playlists accessibles</p>
        </div>
        <Link route="playlists.create" className="btn btn-primary">
          Créer
        </Link>
      </div>

      <section className="admin-section">
        <form onSubmit={submit} className="import-row">
          <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
            <label htmlFor="playlist-search">Recherche</label>
            <input
              id="playlist-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, description..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Rechercher
          </button>
        </form>
        <div className="tabs" style={{ marginTop: "1rem" }}>
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`tab ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-section">
        {playlists.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">♪</span>
            <p>Aucune playlist accessible.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Playlist</th>
                  <th>Type</th>
                  <th>Genre</th>
                  <th>Titres</th>
                  <th>Difficulté</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {playlists.map((playlist) => (
                  <tr key={playlist.id}>
                    <td>
                      <span className="pl-table-name">{playlist.name}</span>
                      {playlist.description && (
                        <div className="td-date">{playlist.description.slice(0, 90)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${playlist.visibility}`}>
                        {playlist.visibility === "public" ? "Publique" : "Privée"}
                      </span>
                    </td>
                    <td>{playlist.genre ?? "-"}</td>
                    <td>{playlist.trackCount}</td>
                    <td>{playlist.difficulty}/5</td>
                    <td>
                      {playlist.canEdit ? (
                        <Link
                          route="playlists.edit"
                          routeParams={{ id: playlist.id }}
                          className="btn-sm btn-success"
                        >
                          Éditer
                        </Link>
                      ) : (
                        <span className="td-date">Lecture</span>
                      )}
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
