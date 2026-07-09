import { useEffect, useRef, useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { AlertDialog } from "radix-ui";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface ShareRow extends Record<string, JSONDataTypes> {
  id: string;
  userId: string;
  canEdit: boolean;
  username: string;
  email: string;
}

interface EditablePlaylist extends Record<string, JSONDataTypes> {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  decade: string | null;
  trackCount: number;
  visibility: "public" | "private";
  isOwner: boolean;
}

interface TrackRow extends Record<string, JSONDataTypes> {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  hasPreview: boolean;
}

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

interface PlaylistImportFlash extends Record<string, JSONDataTypes> {
  importedCount: number;
  skippedCount: number;
}

interface TracksMeta extends Record<string, JSONDataTypes> {
  currentPage: number;
  lastPage: number;
  total: number;
}

interface Props extends InertiaProps {
  playlist: EditablePlaylist;
  tracks: TrackRow[];
  tracksMeta: TracksMeta;
  shares: ShareRow[];
}

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

export default function PlaylistEdit({ playlist, tracks, tracksMeta, shares, flash, user }: Props) {
  const [shareUser, setShareUser] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [removingShareId, setRemovingShareId] = useState<string | null>(null);
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResults, setTrackResults] = useState<TrackSearchResult[]>([]);
  const [trackSearchStatus, setTrackSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const lastAddAt = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const importFlash = flash?.playlistImport as PlaylistImportFlash | undefined;
  const canDeletePlaylist =
    playlist.isOwner || (user as { role?: string } | undefined)?.role === "admin";
  const trackPageHref = (trackPage: number) =>
    `/playlists/${playlist.id}/edit?trackPage=${trackPage}`;
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

  useEffect(() => {
    const query = trackQuery.trim();
    if (query.length < 2) {
      setTrackResults([]);
      setTrackSearchStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setTrackSearchStatus("loading");
      try {
        const response = await fetch(
          `/playlists/${playlist.id}/tracks/search?query=${encodeURIComponent(query)}`,
          { headers: { Accept: "application/json" }, signal: controller.signal },
        );
        if (!response.ok) throw new Error("SEARCH_FAILED");
        const data = (await response.json()) as { results: TrackSearchResult[] };
        setTrackResults(data.results);
        setTrackSearchStatus("idle");
      } catch {
        if (!controller.signal.aborted) setTrackSearchStatus("error");
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [playlist.id, trackQuery]);

  async function addTrack(track: TrackSearchResult) {
    const now = Date.now();
    if (track.alreadyAdded || !track.previewUrl || now - lastAddAt.current < 700) return;
    lastAddAt.current = now;
    setAddingTrackId(`${track.source}:${track.sourceId}`);
    try {
      const response = await fetch(`/playlists/${playlist.id}/tracks`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...csrfHeaders(),
        },
        body: JSON.stringify(track),
      });
      if (!response.ok) throw new Error("ADD_FAILED");
      setTrackResults((current) =>
        current.map((item) =>
          item.source === track.source && item.sourceId === track.sourceId
            ? { ...item, alreadyAdded: true }
            : item,
        ),
      );
      router.reload({ only: ["tracks", "tracksMeta"] });
    } finally {
      setAddingTrackId(null);
    }
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

  function removeSelectedTracks() {
    if (selectedTrackIds.length === 0) return;
    setConfirm({
      title: "Supprimer la sélection ?",
      description: `${selectedTrackIds.length} titre(s) seront retirés de cette playlist.`,
      confirmLabel: "Supprimer",
      onConfirm: () => {
        router.post(
          `/playlists/${playlist.id}/tracks/delete`,
          { trackIds: selectedTrackIds },
          {
            onSuccess: () => {
              setSelectedTrackIds([]);
              setTrackQuery("");
            },
          },
        );
      },
    });
  }

  function deletePlaylist() {
    setConfirm({
      title: "Supprimer la playlist ?",
      description: `La playlist "${playlist.name}" sera définitivement supprimée.`,
      confirmLabel: "Supprimer",
      onConfirm: () => {
        router.post(`/playlists/${playlist.id}/delete`);
      },
    });
  }

  const confirmDialog = (
    <AlertDialog.Root open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-50 bg-black/70"
        />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-[51] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0f0f1a] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        >
          <AlertDialog.Title className="m-0 text-[1.05rem]">
            {confirm?.title}
          </AlertDialog.Title>
          <AlertDialog.Description className="admin-sub mt-2">
            {confirm?.description}
          </AlertDialog.Description>
          <div className="table-actions mt-4 justify-end">
            <AlertDialog.Cancel className={buttonClassName({ variant: "ghost" })}>
              Annuler
            </AlertDialog.Cancel>
            <AlertDialog.Action
              className={buttonClassName({ variant: "danger" })}
              onClick={() => {
                confirm?.onConfirm();
                setConfirm(null);
              }}
            >
              {confirm?.confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
  function toggleTrack(trackId: string) {
    setSelectedTrackIds((current) =>
      current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId],
    );
  }
  const shareSection =
    playlist.visibility === "private" ? (
      <section className="admin-section">
        <h2>Partage</h2>
        <Form
          route="playlists.share"
          routeParams={{ id: playlist.id }}
          onSuccess={() => setShareUser("")}
        >
          {({ errors }) => (
            <div className="import-row">
              <Field className="mb-0 min-w-[220px] flex-1">
                <Label htmlFor="playlist-share-user">Emails ou pseudos</Label>
                <Input
                  id="playlist-share-user"
                  name="user"
                  value={shareUser}
                  onChange={(e) => setShareUser(e.target.value)}
                  placeholder="alice, bob@example.com, charlie"
                />
                {errors.user && <FieldError>{errors.user}</FieldError>}
              </Field>
              <Field className="mb-0 flex-none">
                <Label htmlFor="playlist-share-can-edit">Peut éditer</Label>
                <Switch
                  id="playlist-share-can-edit"
                  name="canEdit"
                  value="true"
                  checked={canEdit}
                  onCheckedChange={setCanEdit}
                  aria-label="Peut éditer"
                />
              </Field>
              <Button type="submit" disabled={!shareUser.trim()}>
                Partager
              </Button>
            </div>
          )}
        </Form>

        {shares.length > 0 && (
          <div className="table-wrap mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Droit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((share) => (
                  <tr key={share.id}>
                    <td>
                      <span className="pl-table-name">{share.username}</span>
                      <div className="td-date">{share.email}</div>
                    </td>
                    <td>{share.canEdit ? "Édition" : "Lecture"}</td>
                    <td>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={removingShareId === share.id}
                        onClick={() => {
                          setRemovingShareId(share.id);
                          router.post(
                            `/playlists/${playlist.id}/share/${share.id}/delete`,
                            {},
                            { onFinish: () => setRemovingShareId(null) },
                          );
                        }}
                      >
                        {removingShareId === share.id ? "Retrait..." : "Retirer"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    ) : null;

  return (
    <div className="admin-page">
      {confirmDialog}
      <div className="admin-topbar">
        <div>
          <h1>{playlist.name}</h1>
          <p className="admin-sub">
            {playlist.visibility === "public" ? "Playlist publique" : "Playlist privée"} ·{" "}
            {playlist.trackCount} titres
          </p>
        </div>
        <div className="table-actions">
          {canDeletePlaylist && (
            <Button type="button" variant="danger" onClick={deletePlaylist}>
              Supprimer
            </Button>
          )}
          <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
            Retour
          </Link>
        </div>
      </div>

      {shareSection}

      <section className="admin-section">
        <h2>Édition</h2>
        <Form route="playlists.update" routeParams={{ id: playlist.id }}>
          {({ errors }) => (
            <>
              <div className="options-row">
                <Field>
                  <Label htmlFor="playlist-name">Nom</Label>
                  <Input id="playlist-name" name="name" defaultValue={playlist.name} />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </Field>
                <Field>
                  <Label htmlFor="playlist-genre">Genre</Label>
                  <Input id="playlist-genre" name="genre" defaultValue={playlist.genre ?? ""} />
                </Field>
                <Field>
                  <Label htmlFor="playlist-decade">Décennie</Label>
                  <Input
                    id="playlist-decade"
                    name="decade"
                    defaultValue={playlist.decade ?? ""}
                    placeholder="1980s"
                  />
                </Field>
              </div>
              <Field>
                <Label htmlFor="playlist-description">Description</Label>
                <Textarea
                  id="playlist-description"
                  name="description"
                  defaultValue={playlist.description ?? ""}
                />
              </Field>
              <Button type="submit">Enregistrer</Button>
            </>
          )}
        </Form>
      </section>

      <section className="admin-section">
        <h2>Musiques ({tracksMeta.total})</h2>
        <div className="import-row flex-col !items-stretch">
          <Field className="mb-0 min-w-[220px] flex-1">
            <Label htmlFor="track-search">Ajouter une musique</Label>
            <Input
              id="track-search"
              type="search"
              value={trackQuery}
              onChange={(event) => setTrackQuery(event.target.value)}
              placeholder="Artiste ou titre"
            />
          </Field>
          {trackQuery.trim().length >= 2 && (
            <div className="table-wrap mb-0 max-h-[360px] overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pochette</th>
                    <th>Titre</th>
                    <th>Artiste</th>
                    <th>Album</th>
                    <th>Source</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackResults.map((track) => {
                    const rowId = `${track.source}:${track.sourceId}`;
                    const canAdd = !track.alreadyAdded && Boolean(track.previewUrl);
                    const addFromRow = () => {
                      if (canAdd && addingTrackId !== rowId) addTrack(track);
                    };
                    return (
                      <tr
                        key={rowId}
                        role={canAdd ? "button" : undefined}
                        tabIndex={canAdd ? 0 : undefined}
                        onClick={addFromRow}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            addFromRow();
                          }
                        }}
                        className={canAdd ? "cursor-pointer" : undefined}
                      >
                        <td>
                          {track.coverUrl ? (
                            <img
                              src={track.coverUrl}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <span className="pl-table-name">{track.title}</span>
                        </td>
                        <td>{track.artist}</td>
                        <td>{track.album ?? "-"}</td>
                        <td>{track.source === "deezer" ? "Deezer" : "Spotify"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <PreviewButton
                              id={rowId}
                              title={track.title}
                              previewUrl={track.previewUrl}
                              playingId={playingId}
                              togglePreview={togglePreview}
                              stopPropagation
                            />
                            <Button
                            type="button"
                            size="sm"
                            variant={track.alreadyAdded ? "success" : "secondary"}
                            disabled={!canAdd || addingTrackId === rowId}
                            onClick={(event) => {
                              event.stopPropagation();
                              addTrack(track);
                            }}
                          >
                            {track.alreadyAdded
                              ? "Ajouté"
                              : !track.previewUrl
                                ? "Sans extrait"
                                : addingTrackId === rowId
                                  ? "Ajout..."
                                  : "Ajouter"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {trackResults.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        {trackSearchStatus === "loading"
                          ? "Recherche..."
                          : trackSearchStatus === "error"
                            ? "Recherche indisponible."
                            : "Aucun résultat."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {importFlash && (
          <p className="admin-sub mb-4">
            {importFlash.importedCount} titres ajoutés, {importFlash.skippedCount} non ajoutés.
          </p>
        )}
        {tracks.length > 0 ? (
          <div className="table-wrap">
            <div className="table-actions px-4 py-3">
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={selectedTrackIds.length === 0}
                onClick={removeSelectedTracks}
              >
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
                Supprimer la sélection
              </Button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sélection</th>
                  <th>Écouter</th>
                  <th>Titre</th>
                  <th>Artiste</th>
                  <th>Album</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner ${track.title}`}
                        checked={selectedTrackIds.includes(track.id)}
                        onChange={() => toggleTrack(track.id)}
                      />
                    </td>
                    <td>
                      <PreviewButton
                        id={`track:${track.id}`}
                        title={track.title}
                        previewUrl={track.previewUrl}
                        playingId={playingId}
                        togglePreview={togglePreview}
                      />
                    </td>
                    <td>
                      <span className="pl-table-name">{track.title}</span>
                    </td>
                    <td>{track.artist}</td>
                    <td>{track.album ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tracksMeta.lastPage > 1 && (
              <div className="pager">
                {tracksMeta.currentPage > 1 ? (
                  <Link
                    href={trackPageHref(tracksMeta.currentPage - 1)}
                    className={buttonClassName({ variant: "ghost", size: "sm" })}
                    preserveScroll
                  >
                    Précédent
                  </Link>
                ) : (
                  <span className={buttonClassName({ variant: "ghost", size: "sm" })}>
                    Précédent
                  </span>
                )}
                <span className="pager-info">
                  Page {tracksMeta.currentPage}/{tracksMeta.lastPage} - {tracksMeta.total} titres
                </span>
                {tracksMeta.currentPage < tracksMeta.lastPage ? (
                  <Link
                    href={trackPageHref(tracksMeta.currentPage + 1)}
                    className={buttonClassName({ variant: "ghost", size: "sm" })}
                    preserveScroll
                  >
                    Suivant
                  </Link>
                ) : (
                  <span className={buttonClassName({ variant: "ghost", size: "sm" })}>Suivant</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="admin-sub">Aucune musique dans cette playlist.</p>
        )}
      </section>
    </div>
  );
}

function PreviewButton({
  id,
  title,
  previewUrl,
  playingId,
  togglePreview,
  stopPropagation = false,
}: {
  id: string;
  title: string;
  previewUrl: string | null;
  playingId: string | null;
  togglePreview: (id: string, previewUrl: string | null) => void;
  stopPropagation?: boolean;
}) {
  return (
    <button
      type="button"
      className={buttonClassName({ variant: "secondary", size: "sm" })}
      disabled={!previewUrl}
      aria-label={`Écouter ${title}`}
      title={previewUrl ? "Écouter" : "Extrait indisponible"}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        togglePreview(id, previewUrl);
      }}
    >
      {playingId === id ? <PauseIcon /> : <PlayIcon />}
    </button>
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
