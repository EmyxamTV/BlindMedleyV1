import { useState, type FormEvent } from "react";
import { Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { Button, buttonClassName } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Field, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface PlaylistRow extends Record<string, JSONDataTypes> {
  id: number;
  name: string;
  description: string | null;
  coverUrl: string | null;
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
  const [joinCode, setJoinCode] = useState("");
  const searchPlaylists = useDebouncedCallback(
    (next: string) =>
      router.get(
        "/playlists",
        { search: next, filter },
        { replace: true, preserveState: true, preserveScroll: true },
      ),
    { wait: 300 },
  );

  function setFilter(next: Props["filter"]) {
    router.get("/playlists", { search: q, filter: next });
  }

  function joinPrivateGame(e: FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.post("/game/0/join", { code: joinCode.toUpperCase() });
  }

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Playlists</h1>
          <p className="admin-sub">{meta.total} playlists accessibles</p>
        </div>
        <Link route="playlists.create" className={buttonClassName()}>
          Créer
        </Link>
      </div>

      <section className="admin-section join-private-section">
        <form onSubmit={joinPrivateGame} className="join-private-form">
          <Field style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <Label htmlFor="join-code">Rejoindre une partie privée</Label>
            <Input
              id="join-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code"
              maxLength={8}
            />
          </Field>
          <Button type="submit" disabled={!joinCode.trim()}>
            Rejoindre
          </Button>
        </form>
      </section>

      <section className="admin-section">
        <div className="import-row">
          <Field style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
            <Label htmlFor="playlist-search">Recherche</Label>
            <Input
              id="playlist-search"
              type="search"
              value={q}
              onChange={(e) => {
                const next = e.target.value;
                setQ(next);
                searchPlaylists(next);
              }}
              placeholder="Nom, description..."
            />
          </Field>
        </div>
        <div className="tabs" style={{ marginTop: "1rem" }}>
          {FILTERS.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              className={`tab ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
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
          <div className="playlist-card-grid">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="playlist-card">
                <Link
                  route="playlists.play"
                  routeParams={{ id: playlist.id }}
                  className="playlist-card-play"
                >
                  <div className="playlist-card-cover">
                    {playlist.coverUrl ? (
                      <img src={playlist.coverUrl} alt="" />
                    ) : (
                      <span className="playlist-card-note">♪</span>
                    )}
                    <span className="playlist-card-cta">Jouer</span>
                  </div>
                  <div className="playlist-card-body">
                    <div className="playlist-card-title-row">
                      <h2>{playlist.name}</h2>
                      <span className={`status-badge status-${playlist.visibility}`}>
                        {playlist.visibility === "public" ? "Publique" : "Privée"}
                      </span>
                    </div>
                    {playlist.description && <p>{playlist.description}</p>}
                    <div className="playlist-card-meta">
                      <span>{playlist.trackCount} titres</span>
                      <span>Difficulté {playlist.difficulty}/5</span>
                      {playlist.genre && <span>{playlist.genre}</span>}
                    </div>
                  </div>
                </Link>
                {playlist.canEdit && (
                  <div className="playlist-card-actions">
                    <Link
                      route="playlists.edit"
                      routeParams={{ id: playlist.id }}
                      className={buttonClassName({ variant: "secondary", size: "sm" })}
                    >
                      Éditer
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
