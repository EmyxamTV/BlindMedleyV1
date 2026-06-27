import { useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { InertiaProps } from "~/types";

export default function PlaylistCreate(_props: InertiaProps) {
  const [url, setUrl] = useState("");

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Créer une playlist</h1>
          <p className="admin-sub">Import Deezer ou Spotify</p>
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Retour
        </Link>
      </div>

      <section className="admin-section">
        <Form route="playlists.store">
          {({ errors }) => (
            <div className="import-row">
              <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <Label htmlFor="playlist-url">URL de playlist</Label>
                <Input
                  id="playlist-url"
                  type="text"
                  name="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                {errors.url && <FieldError>{errors.url}</FieldError>}
              </Field>
              <Button type="submit" disabled={!url.trim()}>
                Importer
              </Button>
            </div>
          )}
        </Form>
      </section>
    </div>
  );
}
