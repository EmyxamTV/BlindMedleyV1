import { useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
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
  difficulty: number;
  visibility: "public" | "private";
}

interface TrackRow extends Record<string, JSONDataTypes> {
  id: string;
  title: string;
  artist: string;
  album: string | null;
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

export default function PlaylistEdit({ playlist, tracks, tracksMeta, shares, flash }: Props) {
  const [shareUser, setShareUser] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const importFlash = flash?.playlistImport as PlaylistImportFlash | undefined;
  const trackPageHref = (trackPage: number) =>
    `/playlists/${playlist.id}/edit?trackPage=${trackPage}`;
  const shareSection =
    playlist.visibility === "private" ? (
      <section className="admin-section">
        <h2>Partage</h2>
        <Form route="playlists.share" routeParams={{ id: playlist.id }}>
          {({ errors }) => (
            <div className="import-row">
              <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <Label htmlFor="playlist-share-user">Email ou pseudo</Label>
                <Input
                  id="playlist-share-user"
                  name="user"
                  value={shareUser}
                  onChange={(e) => setShareUser(e.target.value)}
                />
                {errors.user && <FieldError>{errors.user}</FieldError>}
              </Field>
              <Field style={{ flex: "0 0 auto", marginBottom: 0 }}>
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
          <div className="table-wrap" style={{ marginTop: "1rem" }}>
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
                      <Form
                        route="playlists.unshare"
                        routeParams={{ id: playlist.id, shareId: share.id }}
                      >
                        {() => (
                          <button
                            type="submit"
                            className={buttonClassName({ variant: "warn", size: "sm" })}
                          >
                            Retirer
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
    ) : null;

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>{playlist.name}</h1>
          <p className="admin-sub">
            {playlist.visibility === "public" ? "Playlist publique" : "Playlist privée"}
          </p>
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Retour
        </Link>
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
                <Field>
                  <Label htmlFor="playlist-difficulty">Difficulté</Label>
                  <Select
                    id="playlist-difficulty"
                    name="difficulty"
                    defaultValue={String(playlist.difficulty)}
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        {level}/5
                      </option>
                    ))}
                  </Select>
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
              <Button type="submit">
                Enregistrer
              </Button>
            </>
          )}
        </Form>
      </section>

      <section className="admin-section">
        <h2>Musiques</h2>
        {importFlash && (
          <p className="admin-sub" style={{ marginBottom: "1rem" }}>
            {importFlash.importedCount} titres ajoutés, {importFlash.skippedCount} non ajoutés.
          </p>
        )}
        {tracks.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Artiste</th>
                  <th>Album</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id}>
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
                  <span className={buttonClassName({ variant: "ghost", size: "sm" })}>
                    Suivant
                  </span>
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
