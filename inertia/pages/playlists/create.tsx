import { useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { Button, buttonClassName } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { InertiaProps } from "~/types";

export default function PlaylistCreate(_props: InertiaProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [manualName, setManualName] = useState("");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
            Bibliothèque
          </p>
          <h1 className="mt-2 text-4xl font-black text-white">Créer une playlist</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-400">
            Importe une playlist complète ou crée une playlist vide pour ajouter tes musiques une
            par une.
          </p>
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Retour
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Import automatique
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Depuis Deezer ou Spotify</h2>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Colle une URL de playlist, BlindMedley récupère les titres disponibles.
            </p>
          </div>

          <Form route="playlists.store">
            {({ errors }) => (
              <div className="grid gap-4">
                <Field>
                  <Label htmlFor="playlist-name">Nom de la playlist</Label>
                  <Input
                    id="playlist-name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex : Blind test anime"
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </Field>

                <Field>
                  <Label htmlFor="playlist-url">URL de playlist</Label>
                  <Input
                    id="playlist-url"
                    type="text"
                    name="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                  />
                  {errors.url && <FieldError>{errors.url}</FieldError>}
                </Field>

                <div>
                  <Button type="submit" disabled={!url.trim()}>
                    Importer la playlist
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </section>

        <section className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-pink-500/10 p-6 shadow-2xl shadow-purple-950/20">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
              Ajout manuel
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Musique par musique</h2>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              Crée une playlist vide, puis ajoute les sons à l’unité depuis l’écran d’édition.
            </p>
          </div>

          <Form route="playlists.manual.store">
            {({ errors }) => (
              <div className="grid gap-4">
                <Field>
                  <Label htmlFor="manual-playlist-name">Nom de la playlist</Label>
                  <Input
                    id="manual-playlist-name"
                    type="text"
                    name="name"
                    value={manualName}
                    onChange={(event) => setManualName(event.target.value)}
                    placeholder="Ex : Soirée entre potes"
                  />
                  {errors.name && <FieldError>{errors.name}</FieldError>}
                </Field>

                <Button type="submit" disabled={!manualName.trim()}>
                  Créer et ajouter des musiques
                </Button>
              </div>
            )}
          </Form>
        </section>
      </div>
    </div>
  );
}
