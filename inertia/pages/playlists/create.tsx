import { useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
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
        <Link route="playlists.index" className="btn btn-ghost">
          Retour
        </Link>
      </div>

      <section className="admin-section">
        <Form route="playlists.store">
          {({ errors }) => (
            <div className="import-row">
              <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <label htmlFor="playlist-url">URL de playlist</label>
                <input
                  id="playlist-url"
                  type="text"
                  name="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                />
                {errors.url && <div className="field-error">{errors.url}</div>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={!url.trim()}>
                Importer
              </button>
            </div>
          )}
        </Form>
      </section>
    </div>
  );
}
