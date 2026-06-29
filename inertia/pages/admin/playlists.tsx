import { useState } from "react";
import { Link, Form } from "@adonisjs/inertia/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface AdminPlaylist extends Record<string, JSONDataTypes> {
  id: string;
  name: string;
  spotifyId: string | null;
  genre: string | null;
  trackCount: number;
  isActive: boolean;
  lastSyncedAt: string | null;
  tracks: {
    id: string;
    title: string;
    artist: string;
    album: string | null;
    coverUrl: string | null;
    hasPreview: boolean;
  }[];
}

interface Props extends InertiaProps {
  playlists: AdminPlaylist[];
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
              <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <Label>URL de la playlist Spotify</Label>
                <Input
                  type="text"
                  name="spotify_url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                {errors.spotify_url && <FieldError>{errors.spotify_url}</FieldError>}
              </Field>
              <Button type="submit" disabled={!importUrl.trim()}>
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
              </Button>
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
                            className={buttonClassName({
                              variant: p.isActive ? "warn" : "success",
                              size: "sm",
                            })}
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

      <section className="admin-section">
        <h2>Éditer les morceaux</h2>
        <div className="grid gap-4">
          {playlists.map((playlist) => (
            <details
              key={playlist.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-white">{playlist.name}</p>
                    <p className="text-sm text-slate-400">
                      {playlist.tracks.length} morceaux à éditer
                    </p>
                  </div>
                  <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
                    Ouvrir
                  </span>
                </div>
              </summary>

              <div className="mt-4 grid gap-3">
                {playlist.tracks.length === 0 ? (
                  <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                    Aucun morceau dans cette playlist.
                  </p>
                ) : (
                  playlist.tracks.map((track) => (
                    <Form
                      key={track.id}
                      route="admin.playlists.tracks.update"
                      routeParams={{ id: playlist.id, trackId: track.id }}
                    >
                      {({ errors, processing }) => (
                        <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
                          <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg">
                                🎵
                              </div>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`track-${track.id}-title`}
                              className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                            >
                              Titre
                            </label>
                            <Input
                              id={`track-${track.id}-title`}
                              name="title"
                              defaultValue={track.title}
                              className="text-white"
                            />
                            {errors.title && <FieldError>{errors.title}</FieldError>}
                          </div>

                          <div>
                            <label
                              htmlFor={`track-${track.id}-artist`}
                              className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                            >
                              Artiste
                            </label>
                            <Input
                              id={`track-${track.id}-artist`}
                              name="artist"
                              defaultValue={track.artist}
                              className="text-white"
                            />
                            {errors.artist && <FieldError>{errors.artist}</FieldError>}
                          </div>

                          <div className="flex flex-col gap-2 md:pt-6">
                            <Button type="submit" size="sm" disabled={processing}>
                              Enregistrer
                            </Button>
                            <span className="text-xs text-slate-500">
                              {track.hasPreview ? "Extrait OK" : "Sans extrait"}
                            </span>
                          </div>
                        </div>
                      )}
                    </Form>
                  ))
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
