import { useEffect, useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import type { InertiaProps } from "~/types";

interface Playlist {
  id: number;
  name: string;
  trackCount: number;
  genre: string | null;
  difficulty: number;
}

interface PublicGame {
  id: number;
  code: string | null;
  mode: string;
  playlistName: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  difficulty: number;
  createdAt: string;
}

interface Props extends InertiaProps {
  playlists: Playlist[];
  publicGames: PublicGame[];
  myActiveGameId: number | null;
}

const GENRE_COLORS: Record<string, string> = {
  pop: "linear-gradient(135deg, #ec4899, #f43f5e)",
  rock: "linear-gradient(135deg, #6366f1, #4338ca)",
  rap: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  "hip-hop": "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  electro: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  electronic: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  jazz: "linear-gradient(135deg, #f59e0b, #d97706)",
  classique: "linear-gradient(135deg, #10b981, #059669)",
  rnb: "linear-gradient(135deg, #f472b6, #ec4899)",
  metal: "linear-gradient(135deg, #374151, #111827)",
  indie: "linear-gradient(135deg, #34d399, #10b981)",
  latino: "linear-gradient(135deg, #f97316, #ef4444)",
  default: "linear-gradient(135deg, #7c3aed, #ec4899)",
};

function genreColor(genre: string | null): string {
  if (!genre) return GENRE_COLORS.default;
  const key = genre.toLowerCase();
  return GENRE_COLORS[key] ?? GENRE_COLORS.default;
}

function genreEmoji(genre: string | null): string {
  if (!genre) return "🎵";
  const g = genre.toLowerCase();
  if (g.includes("pop")) return "🌟";
  if (g.includes("rock")) return "🎸";
  if (g.includes("rap") || g.includes("hip")) return "🎤";
  if (g.includes("electro")) return "⚡";
  if (g.includes("jazz")) return "🎷";
  if (g.includes("class")) return "🎻";
  if (g.includes("r&b") || g.includes("rnb")) return "🎙️";
  if (g.includes("metal")) return "🤘";
  if (g.includes("indie")) return "🌿";
  if (g.includes("latin")) return "💃";
  return "🎵";
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="diff-dots">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`diff-dot ${i < level ? "on" : ""}`} />
      ))}
    </div>
  );
}

const MODE_CONFIG = {
  solo: { emoji: "🎯", label: "Solo", desc: "Entraîne-toi seul" },
  public: { emoji: "🌍", label: "Public", desc: "Rejoignable par tous" },
  private: { emoji: "🔒", label: "Privé", desc: "Invitation par code" },
} as const;

export default function GameIndex({ playlists, publicGames, myActiveGameId }: Props) {
  const [tab, setTab] = useState<"create" | "join" | "public">("create");
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"solo" | "public" | "private">("solo");
  const [answerMode, setAnswerMode] = useState<"choices" | "text">("choices");
  const [answerTarget, setAnswerTarget] = useState<"title" | "artist" | "both" | "separate">(
    "both",
  );

  useEffect(() => {
    if (tab !== "public") return;
    const interval = window.setInterval(() => router.reload({ only: ["publicGames"] }), 5_000);
    return () => window.clearInterval(interval);
  }, [tab]);

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim()) {
      router.post("/game/0/join", { code: joinCode.toUpperCase() });
    }
  }

  return (
    <div className="game-index">
      {/* Header */}
      <div className="gi-header">
        <div>
          <h1 className="gi-title">Jouer</h1>
          <p className="gi-sub">Crée ou rejoins une partie et teste tes connaissances musicales.</p>
        </div>
        {myActiveGameId && (
          <Link route="game.play" routeParams={{ id: myActiveGameId }} className="btn btn-primary">
            Reprendre ma partie →
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === "create" ? "active" : ""}`}
          onClick={() => setTab("create")}
        >
          Créer
        </button>
        <button className={`tab ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>
          Code
        </button>
        <button
          className={`tab ${tab === "public" ? "active" : ""}`}
          onClick={() => setTab("public")}
        >
          Public
          {publicGames.length > 0 && <span className="tab-badge">{publicGames.length}</span>}
        </button>
      </div>

      {/* ── CRÉER ── */}
      {tab === "create" && (
        <Form route="game.create">
          {({ errors }) => (
            <div className="create-layout">
              {/* Mode */}
              <section className="gi-section">
                <h2 className="gi-section-title">Mode de jeu</h2>
                <div className="mode-grid">
                  {(["solo", "public", "private"] as const).map((m) => {
                    const cfg = MODE_CONFIG[m];
                    return (
                      <label key={m} className={`mode-card ${mode === m ? "selected" : ""}`}>
                        <input
                          type="radio"
                          name="mode"
                          value={m}
                          defaultChecked={m === "solo"}
                          onChange={() => setMode(m)}
                        />
                        <span className="mode-card-emoji">{cfg.emoji}</span>
                        <span className="mode-card-name">{cfg.label}</span>
                        <span className="mode-card-desc">{cfg.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              {answerMode === "text" && (
                <section className="gi-section">
                  <h2 className="gi-section-title">Réponse à trouver</h2>
                  <div className="mode-grid answer-mode-grid">
                    <label className={`mode-card ${answerTarget === "title" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="answerTarget"
                        value="title"
                        checked={answerTarget === "title"}
                        onChange={() => setAnswerTarget("title")}
                      />
                      <span className="mode-card-name">Titre</span>
                      <span className="mode-card-desc">Trouver uniquement le titre</span>
                    </label>
                    <label className={`mode-card ${answerTarget === "artist" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="answerTarget"
                        value="artist"
                        checked={answerTarget === "artist"}
                        onChange={() => setAnswerTarget("artist")}
                      />
                      <span className="mode-card-name">Artiste</span>
                      <span className="mode-card-desc">Trouver uniquement l’artiste</span>
                    </label>
                    <label className={`mode-card ${answerTarget === "both" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="answerTarget"
                        value="both"
                        checked={answerTarget === "both"}
                        onChange={() => setAnswerTarget("both")}
                      />
                      <span className="mode-card-name">Les deux</span>
                      <span className="mode-card-desc">Titre et artiste requis</span>
                    </label>
                    <label className={`mode-card ${answerTarget === "separate" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="answerTarget"
                        value="separate"
                        checked={answerTarget === "separate"}
                        onChange={() => setAnswerTarget("separate")}
                      />
                      <span className="mode-card-name">Points séparés</span>
                      <span className="mode-card-desc">
                        Des points pour le titre, puis pour l’artiste
                      </span>
                    </label>
                  </div>
                </section>
              )}

              <section className="gi-section">
                <h2 className="gi-section-title">Type de réponse</h2>
                <div className="mode-grid answer-mode-grid">
                  <label className={`mode-card ${answerMode === "choices" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="answerMode"
                      value="choices"
                      checked={answerMode === "choices"}
                      onChange={() => setAnswerMode("choices")}
                    />
                    <span className="mode-card-name">QCM</span>
                    <span className="mode-card-desc">Quatre réponses proposées</span>
                  </label>
                  <label className={`mode-card ${answerMode === "text" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="answerMode"
                      value="text"
                      checked={answerMode === "text"}
                      onChange={() => setAnswerMode("text")}
                    />
                    <span className="mode-card-name">Blind test</span>
                    <span className="mode-card-desc">Écris le titre ou l’artiste</span>
                  </label>
                </div>
              </section>

              {/* Playlists */}
              <section className="gi-section">
                <h2 className="gi-section-title">Choisir une playlist</h2>
                {playlists.length === 0 ? (
                  <div className="empty-card game-empty-playlist">
                    <span className="empty-icon">🎵</span>
                    <p>Aucune playlist n’est encore disponible.</p>
                    <Form route="game.starter_playlist">
                      {() => (
                        <button type="submit" className="btn btn-primary">
                          Charger les hits de démarrage
                        </button>
                      )}
                    </Form>
                    <small>
                      Une sélection publique Deezer avec extraits audio sera ajoutée à cette
                      instance.
                    </small>
                  </div>
                ) : (
                  <div className="pl-grid">
                    {playlists.map((p) => (
                      <label
                        key={p.id}
                        className={`pl-card ${selectedPlaylist === p.id ? "selected" : ""}`}
                        onClick={() => setSelectedPlaylist(p.id)}
                      >
                        <input type="radio" name="playlistId" value={p.id} required />

                        {/* Header coloré */}
                        <div className="pl-card-header" style={{ background: genreColor(p.genre) }}>
                          <span className="pl-card-emoji">{genreEmoji(p.genre)}</span>
                          {selectedPlaylist === p.id && <span className="pl-card-check">✓</span>}
                        </div>

                        {/* Body */}
                        <div className="pl-card-body">
                          <span className="pl-card-name">{p.name}</span>
                          <div className="pl-card-meta">
                            {p.genre && <span className="pl-genre">{p.genre}</span>}
                            <span className="pl-tracks">{p.trackCount} titres</span>
                          </div>
                          <DifficultyDots level={p.difficulty} />
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.playlistId && (
                  <div className="field-error" style={{ marginTop: "0.5rem" }}>
                    {errors.playlistId}
                  </div>
                )}
              </section>

              {/* Options */}
              <section className="gi-section">
                <h2 className="gi-section-title">Options</h2>
                <div className="options-row">
                  <div className="form-group">
                    <label>Rounds</label>
                    <select name="roundCount" defaultValue="10">
                      <option value="5">5 rounds</option>
                      <option value="10">10 rounds</option>
                      <option value="15">15 rounds</option>
                      <option value="20">20 rounds</option>
                    </select>
                  </div>
                  {mode !== "solo" && (
                    <div className="form-group">
                      <label>Joueurs max</label>
                      <select name="maxPlayers" defaultValue="8">
                        {[2, 4, 6, 8, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} joueurs
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Difficulté</label>
                    <select name="difficulty" defaultValue="2">
                      <option value="1">Facile · 30 secondes</option>
                      <option value="2">Normal · 25 secondes</option>
                      <option value="3">Difficile · 20 secondes</option>
                      <option value="4">Expert · 15 secondes</option>
                      <option value="5">Légendaire · 10 secondes</option>
                    </select>
                  </div>
                </div>
              </section>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={playlists.length === 0 || selectedPlaylist === null}
              >
                Lancer la partie
              </button>
            </div>
          )}
        </Form>
      )}

      {/* ── CODE ── */}
      {tab === "join" && (
        <div className="join-wrap">
          <div className="join-card">
            <div className="join-icon">🔑</div>
            <h2>Rejoindre avec un code</h2>
            <p>Entre le code à 6 caractères fourni par l'hôte.</p>
            <form onSubmit={handleJoinCode} className="join-form">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3"
                maxLength={8}
                className="code-input"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={!joinCode.trim()}
              >
                Rejoindre
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── PUBLIC ── */}
      {tab === "public" && (
        <div className="public-list">
          {publicGames.length === 0 ? (
            <div className="empty-card">
              <span className="empty-icon">🎮</span>
              <p>Aucune partie publique en attente.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab("create")}>
                Créer une partie →
              </button>
            </div>
          ) : (
            publicGames.map((g) => (
              <div key={g.id} className="pgc">
                <div className="pgc-left">
                  <div className="pgc-playlist">{g.playlistName}</div>
                  <div className="pgc-details">
                    <span className="pgc-host">par {g.hostUsername}</span>
                    <span className="pgc-sep">·</span>
                    <span className="pgc-players">
                      {g.playerCount}/{g.maxPlayers} joueurs
                    </span>
                    <span className="pgc-sep">·</span>
                    <span className={`mode-badge mode-${g.mode}`}>{g.mode}</span>
                  </div>
                </div>
                <div className="pgc-right">
                  <div className="pgc-diff">
                    {Array.from({ length: g.difficulty }, (_, i) => (
                      <span key={i} className="pgc-dot" />
                    ))}
                  </div>
                  <Form route="game.join" routeParams={{ id: g.id }}>
                    {() => (
                      <button type="submit" className="btn btn-primary btn-sm">
                        Rejoindre
                      </button>
                    )}
                  </Form>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
