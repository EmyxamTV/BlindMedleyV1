import { Fragment, useRef, useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface TrackSearchResult extends Record<string, JSONDataTypes> {
  source: "deezer" | "spotify";
  sourceId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  durationMs: number | null;
  releaseYear: number | null;
  alreadyAdded: boolean;
}

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
    previewUrl: string | null;
    hasPreview: boolean;
  }[];
}

interface Props extends InertiaProps {
  playlists: AdminPlaylist[];
}

type SearchStatus = "idle" | "loading" | "error";

export default function AdminPlaylists({ playlists }: Props) {
  const [importUrl, setImportUrl] = useState("");
  const [openedPlaylistId, setOpenedPlaylistId] = useState<string | null>(null);
  const [trackQueries, setTrackQueries] = useState<Record<string, string>>({});
  const [trackResults, setTrackResults] = useState<Record<string, TrackSearchResult[]>>({});
  const [searchStatuses, setSearchStatuses] = useState<Record<string, SearchStatus>>({});
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Record<string, string[]>>({});
  const [removingTrackIds, setRemovingTrackIds] = useState<string[]>([]);
  const lastAddAt = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const active = playlists.filter((playlist) => playlist.isActive).length;

  const csrfHeaders = () => {
    const xsrf = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    return {
      "X-CSRF-TOKEN":
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
      "X-XSRF-TOKEN": xsrf ? decodeURIComponent(xsrf) : "",
    };
  };

  async function searchTracks(playlistId: string) {
    const query = trackQueries[playlistId]?.trim() ?? "";
    if (query.length < 2) {
      setTrackResults((current) => ({ ...current, [playlistId]: [] }));
      setSearchStatuses((current) => ({ ...current, [playlistId]: "idle" }));
      return;
    }

    setSearchStatuses((current) => ({ ...current, [playlistId]: "loading" }));
    try {
      const response = await fetch(
        `/playlists/${playlistId}/tracks/search?query=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error("SEARCH_FAILED");
      const data = (await response.json()) as { results: TrackSearchResult[] };
      setTrackResults((current) => ({ ...current, [playlistId]: data.results }));
      setSearchStatuses((current) => ({ ...current, [playlistId]: "idle" }));
    } catch {
      setSearchStatuses((current) => ({ ...current, [playlistId]: "error" }));
    }
  }

  async function addTrack(playlistId: string, track: TrackSearchResult) {
    const now = Date.now();
    const rowId = `${playlistId}:${track.source}:${track.sourceId}`;
    if (track.alreadyAdded || !track.previewUrl || now - lastAddAt.current < 700) return;

    lastAddAt.current = now;
    setAddingTrackId(rowId);
    try {
      const response = await fetch(`/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...csrfHeaders(),
        },
        body: JSON.stringify(track),
      });

      if (!response.ok) throw new Error("ADD_FAILED");
      setTrackResults((current) => ({
        ...current,
        [playlistId]: (current[playlistId] ?? []).map((item) =>
          item.source === track.source && item.sourceId === track.sourceId
            ? { ...item, alreadyAdded: true }
            : item,
        ),
      }));
      router.reload({ only: ["playlists"] });
    } finally {
      setAddingTrackId(null);
    }
  }

  async function removeTracks(playlistId: string, trackIds: string[]) {
    const ids = [...new Set(trackIds)].filter(Boolean);
    if (ids.length === 0) return;
    const message =
      ids.length === 1
        ? "Supprimer cette musique de la playlist ?"
        : `Supprimer ${ids.length} musiques de la playlist ?`;
    if (!window.confirm(message)) return;

    setRemovingTrackIds(ids);
    try {
      const response = await fetch(`/playlists/${playlistId}/tracks/delete`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...csrfHeaders(),
        },
        body: JSON.stringify({ trackIds: ids }),
      });

      if (!response.ok) throw new Error("REMOVE_FAILED");
      setSelectedTrackIds((current) => ({ ...current, [playlistId]: [] }));
      router.reload({ only: ["playlists"] });
    } finally {
      setRemovingTrackIds([]);
    }
  }

  function toggleTrackSelection(playlistId: string, trackId: string) {
    setSelectedTrackIds((current) => {
      const selected = current[playlistId] ?? [];
      return {
        ...current,
        [playlistId]: selected.includes(trackId)
          ? selected.filter((id) => id !== trackId)
          : [...selected, trackId],
      };
    });
  }

  function toggleAllTracks(playlistId: string, trackIds: string[]) {
    setSelectedTrackIds((current) => {
      const selected = current[playlistId] ?? [];
      const allSelected = trackIds.length > 0 && selected.length === trackIds.length;
      return {
        ...current,
        [playlistId]: allSelected ? [] : trackIds,
      };
    });
  }

  function togglePreview(id: string, previewUrl: string | null) {
    if (!previewUrl) return;

    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(previewUrl);
    audio.volume = 0.75;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(id);
    void audio.play().catch(() => setPlayingId(null));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 text-slate-100">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Playlists Spotify</h1>
          <p className="mt-1 text-sm text-slate-400">
            {active} actives sur {playlists.length}
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <Link
            route="admin.dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link
            route="admin.users"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Utilisateurs
          </Link>
          <Link
            route="admin.playlists"
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-sm font-bold text-violet-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
            </svg>
            Playlists
          </Link>
        </nav>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-violet-200">
          Importer depuis Spotify
        </h2>
        <Form route="admin.playlists.import">
          {({ errors }) => (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-end">
              <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <Label>Nom de la playlist</Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="Nom personnalisé"
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>
              <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <Label>URL de la playlist Spotify</Label>
                <Input
                  type="text"
                  name="spotify_url"
                  value={importUrl}
                  onChange={(event) => setImportUrl(event.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                {errors.spotify_url && <FieldError>{errors.spotify_url}</FieldError>}
              </Field>
              <Button type="submit" disabled={!importUrl.trim()}>
                Importer
              </Button>
            </div>
          )}
        </Form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-violet-200">
          Playlists ({playlists.length})
        </h2>
        {playlists.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
            <span className="mb-2 block text-3xl">🎵</span>
            <p>Aucune playlist importée. Colle une URL Spotify ci-dessus.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Playlist</th>
                  <th className="px-4 py-3">Genre</th>
                  <th className="px-4 py-3">Titres</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Sync</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {playlists.map((playlist) => {
                  const isOpen = openedPlaylistId === playlist.id;
                  const playlistSelectedIds = selectedTrackIds[playlist.id] ?? [];
                  const allTrackIds = playlist.tracks.map((track) => track.id);
                  return (
                    <Fragment key={playlist.id}>
                      <tr
                        className={`border-b border-white/10 ${
                          playlist.isActive ? "" : "opacity-60"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <span className="font-black text-white">{playlist.name}</span>
                        </td>
                        <td className="px-4 py-4">
                          {playlist.genre ? (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-bold text-slate-300">
                              {playlist.genre}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-bold text-white">{playlist.trackCount}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                              playlist.isActive
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-slate-500/15 text-slate-400"
                            }`}
                          >
                            {playlist.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">
                          {playlist.lastSyncedAt ? (
                            new Date(playlist.lastSyncedAt).toLocaleDateString("fr-FR")
                          ) : (
                            <span className="text-slate-500">Jamais</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={buttonClassName({ variant: "secondary", size: "sm" })}
                              aria-label={`Éditer ${playlist.name}`}
                              title="Éditer"
                              onClick={() => setOpenedPlaylistId(isOpen ? null : playlist.id)}
                            >
                              {isOpen ? <CloseIcon /> : <EditIcon />}
                            </button>
                            <Form route="admin.playlists.toggle" routeParams={{ id: playlist.id }}>
                              {() => (
                                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300 transition hover:border-violet-300/40 hover:text-white">
                                  <Switch
                                    type="submit"
                                    size="sm"
                                    checked={playlist.isActive}
                                    aria-label={
                                      playlist.isActive
                                        ? `Désactiver ${playlist.name}`
                                        : `Activer ${playlist.name}`
                                    }
                                  />
                                  <span>{playlist.isActive ? "Active" : "Inactive"}</span>
                                </label>
                              )}
                            </Form>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-5 rounded-xl border border-violet-300/20 bg-black/25 p-4">
                              <Form route="admin.playlists.update" routeParams={{ id: playlist.id }}>
                                {({ errors, processing }) => (
                                  <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,260px)_auto] md:items-end">
                                    <Field style={{ marginBottom: 0 }}>
                                      <Label htmlFor={`playlist-${playlist.id}-name`}>
                                        Nom de la playlist
                                      </Label>
                                      <Input
                                        id={`playlist-${playlist.id}-name`}
                                        name="name"
                                        defaultValue={playlist.name}
                                        className="text-white"
                                      />
                                      {errors.name && <FieldError>{errors.name}</FieldError>}
                                    </Field>
                                    <Field style={{ marginBottom: 0 }}>
                                      <Label htmlFor={`playlist-${playlist.id}-genre`}>
                                        Genre
                                      </Label>
                                      <Input
                                        id={`playlist-${playlist.id}-genre`}
                                        name="genre"
                                        defaultValue={playlist.genre ?? ""}
                                        className="text-white"
                                      />
                                      {errors.genre && <FieldError>{errors.genre}</FieldError>}
                                    </Field>
                                    <Button type="submit" disabled={processing}>
                                      Enregistrer
                                    </Button>
                                  </div>
                                )}
                              </Form>

                              <AddTrackPanel
                                playlistId={playlist.id}
                                query={trackQueries[playlist.id] ?? ""}
                                status={searchStatuses[playlist.id] ?? "idle"}
                                results={trackResults[playlist.id] ?? []}
                                addingTrackId={addingTrackId}
                                playingId={playingId}
                                setQuery={(value) =>
                                  setTrackQueries((current) => ({
                                    ...current,
                                    [playlist.id]: value,
                                  }))
                                }
                                searchTracks={() => void searchTracks(playlist.id)}
                                addTrack={(track) => void addTrack(playlist.id, track)}
                                togglePreview={togglePreview}
                              />

                              <div className="grid gap-3">
                                {playlist.tracks.length === 0 ? (
                                  <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                                    Aucun morceau dans cette playlist.
                                  </p>
                                ) : (
                                  <>
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                      <p className="text-sm text-slate-400">
                                        {playlistSelectedIds.length > 0
                                          ? `${playlistSelectedIds.length} sélectionnée(s)`
                                          : "Sélectionne une ou plusieurs musiques à supprimer."}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          className={buttonClassName({
                                            variant: "secondary",
                                            size: "sm",
                                          })}
                                          onClick={() => toggleAllTracks(playlist.id, allTrackIds)}
                                        >
                                          {playlistSelectedIds.length === playlist.tracks.length
                                            ? "Tout désélectionner"
                                            : "Tout sélectionner"}
                                        </button>
                                        <button
                                          type="button"
                                          className={buttonClassName({ variant: "warn", size: "sm" })}
                                          disabled={
                                            playlistSelectedIds.length === 0 ||
                                            removingTrackIds.length > 0
                                          }
                                          onClick={() =>
                                            void removeTracks(playlist.id, playlistSelectedIds)
                                          }
                                        >
                                          Supprimer la sélection
                                        </button>
                                      </div>
                                    </div>

                                    {playlist.tracks.map((track) => (
                                      <Form
                                        key={track.id}
                                        route="admin.playlists.tracks.update"
                                        routeParams={{ id: playlist.id, trackId: track.id }}
                                    >
                                      {({ errors, processing }) => (
                                        <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[auto_56px_minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] md:items-start">
                                          <label className="flex h-12 items-center justify-center md:pt-0">
                                            <span className="sr-only">
                                              Sélectionner {track.title}
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={playlistSelectedIds.includes(track.id)}
                                              onChange={() =>
                                                toggleTrackSelection(playlist.id, track.id)
                                              }
                                              className="h-4 w-4 rounded border-white/20 bg-black/30 accent-violet-500"
                                            />
                                          </label>
                                          <TrackCover coverUrl={track.coverUrl} />

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
                                            {errors.artist && (
                                              <FieldError>{errors.artist}</FieldError>
                                            )}
                                          </div>

                                          <div className="flex flex-col gap-2 md:pt-6">
                                            <PreviewButton
                                              id={`track:${track.id}`}
                                              title={track.title}
                                              previewUrl={track.previewUrl}
                                              playingId={playingId}
                                              togglePreview={togglePreview}
                                            />
                                          </div>

                                          <div className="flex flex-col gap-2 md:pt-6">
                                            <Button type="submit" size="sm" disabled={processing}>
                                              Enregistrer
                                            </Button>
                                            <span className="text-xs text-slate-500">
                                              {track.hasPreview ? "Extrait OK" : "Sans extrait"}
                                            </span>
                                          </div>

                                          <div className="flex flex-col gap-2 md:pt-6">
                                            <button
                                              type="button"
                                              className={buttonClassName({
                                                variant: "warn",
                                                size: "sm",
                                              })}
                                              disabled={removingTrackIds.includes(track.id)}
                                              aria-label={`Supprimer ${track.title}`}
                                              title="Supprimer"
                                              onClick={() =>
                                                void removeTracks(playlist.id, [track.id])
                                              }
                                            >
                                              <TrashIcon />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      </Form>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AddTrackPanel({
  playlistId,
  query,
  status,
  results,
  addingTrackId,
  playingId,
  setQuery,
  searchTracks,
  addTrack,
  togglePreview,
}: {
  playlistId: string;
  query: string;
  status: SearchStatus;
  results: TrackSearchResult[];
  addingTrackId: string | null;
  playingId: string | null;
  setQuery: (value: string) => void;
  searchTracks: () => void;
  addTrack: (track: TrackSearchResult) => void;
  togglePreview: (id: string, previewUrl: string | null) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div>
        <p className="text-sm font-black text-white">Ajouter une musique</p>
        <p className="text-xs text-slate-400">
          Recherche un titre, puis ajoute uniquement les résultats avec un extrait disponible.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              searchTracks();
            }
          }}
          placeholder="Titre, artiste..."
          className="text-white"
        />
        <Button type="button" onClick={searchTracks} disabled={query.trim().length < 2 || status === "loading"}>
          Rechercher
        </Button>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-300">Impossible de chercher pour le moment.</p>
      )}

      {results.length > 0 && (
        <div className="grid gap-2">
          {results.map((track) => {
            const rowId = `${playlistId}:${track.source}:${track.sourceId}`;
            const canAdd = !track.alreadyAdded && Boolean(track.previewUrl);
            return (
              <div
                key={rowId}
                className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[44px_minmax(0,1fr)_auto_auto] md:items-center"
              >
                <TrackCover coverUrl={track.coverUrl} small />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-400">
                    {track.artist}
                    {track.album ? ` · ${track.album}` : ""}
                  </p>
                </div>
                <PreviewButton
                  id={rowId}
                  title={track.title}
                  previewUrl={track.previewUrl}
                  playingId={playingId}
                  togglePreview={togglePreview}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!canAdd || addingTrackId === rowId}
                  onClick={() => addTrack(track)}
                >
                  {track.alreadyAdded ? "Déjà ajoutée" : track.previewUrl ? "Ajouter" : "Sans extrait"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrackCover({ coverUrl, small = false }: { coverUrl: string | null; small?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-white/10 bg-white/5 ${
        small ? "h-11 w-11" : "h-12 w-12"
      }`}
    >
      {coverUrl ? (
        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg">🎵</div>
      )}
    </div>
  );
}

function PreviewButton({
  id,
  title,
  previewUrl,
  playingId,
  togglePreview,
}: {
  id: string;
  title: string;
  previewUrl: string | null;
  playingId: string | null;
  togglePreview: (id: string, previewUrl: string | null) => void;
}) {
  return (
    <button
      type="button"
      className={buttonClassName({ variant: "secondary", size: "sm" })}
      disabled={!previewUrl}
      aria-label={`Écouter ${title}`}
      title={previewUrl ? "Écouter" : "Extrait indisponible"}
      onClick={() => togglePreview(id, previewUrl)}
    >
      {playingId === id ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}
