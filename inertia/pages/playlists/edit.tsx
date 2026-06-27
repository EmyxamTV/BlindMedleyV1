import { useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
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

interface Props extends InertiaProps {
  playlist: EditablePlaylist;
  shares: ShareRow[];
}

export default function PlaylistEdit({ playlist, shares }: Props) {
  const [shareUser, setShareUser] = useState("");

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

      {playlist.visibility === "private" && (
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
                <label className="form-group" style={{ marginBottom: 0 }}>
                  <span>Peut éditer</span>
                  <input type="checkbox" name="canEdit" value="true" aria-label="Peut éditer" />
                </label>
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
                            <button type="submit" className="btn-sm btn-warn">
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
      )}
    </div>
  );
}
