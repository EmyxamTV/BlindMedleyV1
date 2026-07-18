import { useEffect, useMemo, useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { Transmit } from "@adonisjs/transmit-client";
import { buttonClassName } from "~/components/ui/button";
import { createRealtimeUid } from "~/lib/realtime";
import { unlockAudio } from "~/lib/audio_unlock";
import { routeUrl } from "~/lib/routes";
import type { GameData, InertiaProps } from "~/types";

type TrackOption = {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
};

type PlaylistOption = {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  genre?: string | null;
  trackCount: number;
  tracks: TrackOption[];
};

interface Props extends InertiaProps {
  playlists: PlaylistOption[];
  publicGames: GameData[];
  myActiveGameId: string | null;
}

const MODES = {
  solo: { emoji: "🎯", label: "Solo", desc: "Entraîne-toi seul" },
  public: { emoji: "🌍", label: "Public", desc: "Rejoignable par tous" },
  private: { emoji: "🔒", label: "Privé", desc: "Invitation par code" },
} as const;

const DIFFICULTIES = [
  { value: 1, label: "Facile", desc: "30 secondes" },
  { value: 2, label: "Normal", desc: "25 secondes" },
  { value: 3, label: "Difficile", desc: "20 secondes" },
  { value: 4, label: "Expert", desc: "15 secondes" },
  { value: 5, label: "Légendaire", desc: "10 secondes" },
] as const;

function publicGameStatusLabel(status: string) {
  if (status === "waiting") return "En attente";
  if (status === "starting") return "Démarrage";
  if (status === "active") return "En cours";
  if (status === "paused") return "En pause";
  return status;
}

function publicGameStatusClass(status: string) {
  if (status === "active") return "border-emerald-300/25 bg-emerald-500/10 text-emerald-200";
  if (status === "paused") return "border-amber-300/25 bg-amber-500/10 text-amber-200";
  if (status === "starting") return "border-violet-300/25 bg-violet-500/10 text-violet-200";
  return "border-sky-300/25 bg-sky-500/10 text-sky-200";
}

export default function GameIndex({ playlists, publicGames, myActiveGameId }: Props) {
  const [tab, setTab] = useState<"create" | "join" | "public">("public");
  const [gameName, setGameName] = useState("");
  const [mode, setMode] = useState<"solo" | "public" | "private">("solo");
  const [answerMode, setAnswerMode] = useState<"choices" | "text">("choices");
  const [answerTarget, setAnswerTarget] = useState<"title" | "artist" | "both" | "separate">(
    "both",
  );
  const [roundCount, setRoundCount] = useState(10);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [difficulty, setDifficulty] = useState(2);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<TrackOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const selectedTrackSet = useMemo(() => new Set(selectedTrackIds), [selectedTrackIds]);
  const selectedPlaylistSet = useMemo(() => new Set(selectedPlaylistIds), [selectedPlaylistIds]);
  const selectedPlaylists = useMemo(
    () => playlists.filter((playlist) => selectedPlaylistSet.has(playlist.id)),
    [playlists, selectedPlaylistSet],
  );
  const tracksFromSelectedPlaylists = useMemo(() => {
    const tracks = new Map<string, TrackOption>();
    for (const playlist of selectedPlaylists) {
      for (const track of playlist.tracks) tracks.set(track.id, track);
    }
    return [...tracks.values()];
  }, [selectedPlaylists]);
  const selectedTracks = useMemo(() => {
    const tracks = new Map<string, TrackOption>();
    for (const track of tracksFromSelectedPlaylists) tracks.set(track.id, track);
    for (const track of searchResults) {
      if (selectedTrackSet.has(track.id)) tracks.set(track.id, track);
    }
    return [...tracks.values()].filter((track) => selectedTrackSet.has(track.id));
  }, [searchResults, selectedTrackSet, tracksFromSelectedPlaylists]);
  const estimatedTrackCount = new Set([
    ...tracksFromSelectedPlaylists.map((track) => track.id),
    ...selectedTrackIds,
  ]).size;
  const canCreate = selectedPlaylistIds.length > 0 || selectedTrackIds.length > 0;

  useEffect(() => {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: createRealtimeUid,
    });
    const subscription = transmit.subscription("games/public");
    let cancelled = false;
    let reloadTimer: number | null = null;
    let reloading = false;
    let reloadQueued = false;

    const reloadPublicGames = () => {
      if (cancelled || tab !== "public" || document.visibilityState !== "visible") return;
      if (reloading) {
        reloadQueued = true;
        return;
      }

      reloading = true;
      router.reload({
        only: ["publicGames", "myActiveGameId"],
        onFinish: () => {
          reloading = false;
          if (reloadQueued) {
            reloadQueued = false;
            scheduleReload();
          }
        },
      });
    };

    const scheduleReload = () => {
      if (reloadTimer !== null) window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(reloadPublicGames, 350);
    };

    const removeMessageHandler = subscription.onMessage<{ event: string }>((message) => {
      if (cancelled) return;
      if (message.event === "public_games_changed") {
        scheduleReload();
      }
    });

    void subscription.create().then(() => {
      if (!cancelled) scheduleReload();
    });

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") {
        scheduleReload();
      }
    };

    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      cancelled = true;
      removeMessageHandler();
      if (reloadTimer !== null) window.clearTimeout(reloadTimer);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      void subscription.delete().finally(() => transmit.close());
    };
  }, [tab]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (search.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const url = new URL("/game/tracks/search", window.location.origin);
        url.searchParams.set("query", search.trim());
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await response.json()) as { results: TrackOption[] };
        setSearchResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  function togglePlaylist(id: string) {
    setSelectedPlaylistIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleTrack(id: string) {
    setSelectedTrackIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function createGame() {
    await unlockAudio();
    router.post("/game", {
      name: gameName.trim() || undefined,
      mode,
      source: "player",
      answerMode,
      answerTarget: answerMode === "text" ? answerTarget : "both",
      playlistIds: selectedPlaylistIds,
      trackIds: selectedTrackIds,
      roundCount,
      maxPlayers: mode === "solo" ? undefined : maxPlayers,
      difficulty,
    });
  }

  async function joinByCode(event: React.FormEvent) {
    event.preventDefault();
    if (!joinCode.trim()) return;
    await unlockAudio();
    router.post("/game/0/join", { code: joinCode.trim().toUpperCase() });
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">Jouer</p>
          <h1 className="mt-2 text-4xl font-black text-white md:text-6xl">Créer une partie</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Choisis une ou plusieurs playlists, ajoute des sons à la main, puis lance une partie
            solo, publique ou privée.
          </p>
        </div>
        {myActiveGameId && (
          <Link
            route="game.play"
            routeParams={{ id: myActiveGameId }}
            className={buttonClassName()}
          >
            Reprendre ma partie →
          </Link>
        )}
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {[
          ["create", "Créer"],
          ["join", "Code"],
          ["public", `Public${publicGames.length > 0 ? ` (${publicGames.length})` : ""}`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as "create" | "join" | "public")}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              tab === value
                ? "bg-violet-500 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "create" && (
        <div className="grid gap-6">
          <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
                Nom de la partie
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Optionnel, mais pratique pour reconnaître une partie publique.
              </p>
            </div>
            <input
              value={gameName}
              onChange={(event) => setGameName(event.target.value)}
              maxLength={120}
              placeholder="Ex : Blind test anime du vendredi"
              className="rounded-2xl border border-white/10 bg-[#11111d] px-5 py-4 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/50"
            />
          </section>

          <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
              Mode de jeu
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(MODES).map(([value, config]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as "solo" | "public" | "private")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    mode === value
                      ? "border-violet-300/60 bg-violet-500/15 shadow-lg shadow-violet-950/30"
                      : "border-white/10 bg-black/20 hover:border-violet-300/30"
                  }`}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <strong className="mt-3 block text-white">{config.label}</strong>
                  <span className="mt-1 block text-sm text-slate-400">{config.desc}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
                  Bibliothèque de la partie
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Compose le pool musical avant de lancer la game.
                </p>
              </div>
              <Link
                route="playlists.create"
                className={buttonClassName({ variant: "ghost", size: "sm" })}
              >
                Importer une playlist
              </Link>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-5 p-5">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      1. Sources
                    </h3>
                    {playlists.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPlaylistPickerOpen((open) => !open)}
                        className={buttonClassName({ size: "sm" })}
                      >
                        {playlistPickerOpen ? "Fermer la liste" : "Ajouter une playlist"}
                      </button>
                    )}
                  </div>

                  {playlists.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                      <p className="text-slate-400">Aucune playlist disponible.</p>
                      <Form route="game.starter_playlist">
                        {() => (
                          <button type="submit" className={buttonClassName({ className: "mt-4" })}>
                            Charger les hits de démarrage
                          </button>
                        )}
                      </Form>
                    </div>
                  ) : playlistPickerOpen ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {playlists.map((playlist) => {
                        const selected = selectedPlaylistSet.has(playlist.id);
                        const playableCount = playlist.tracks.length;
                        return (
                          <button
                            key={playlist.id}
                            type="button"
                            onClick={() => togglePlaylist(playlist.id)}
                            className={`group grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                              selected
                                ? "border-fuchsia-300/60 bg-fuchsia-500/15 shadow-lg shadow-fuchsia-950/20"
                                : "border-white/10 bg-black/20 hover:border-fuchsia-300/30 hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="h-16 w-16 overflow-hidden rounded-xl bg-violet-500/20">
                              {playlist.coverUrl ? (
                                <img
                                  src={playlist.coverUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl">
                                  ♪
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <strong className="block truncate text-white">
                                {playlist.name || "Playlist sans nom"}
                              </strong>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {playableCount} extrait(s) jouable(s)
                                {playlist.genre ? ` · ${playlist.genre}` : ""}
                              </p>
                            </div>
                            <span
                              className={`grid h-7 w-7 place-items-center rounded-full border text-sm font-black ${
                                selected
                                  ? "border-fuchsia-300 bg-fuchsia-400 text-white"
                                  : "border-white/15 text-slate-500 group-hover:text-white"
                              }`}
                            >
                              {selected ? "✓" : "+"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlaylistPickerOpen(true)}
                      className="rounded-2xl border border-dashed border-violet-300/35 bg-violet-500/10 p-8 text-center transition hover:border-violet-200/70 hover:bg-violet-500/15"
                    >
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-violet-500 text-2xl font-black text-white">
                        +
                      </span>
                      <strong className="mt-4 block text-white">Ajouter une playlist</strong>
                      <span className="mt-1 block text-sm text-slate-400">
                        Ouvre la liste de tes playlists disponibles.
                      </span>
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      2. Ajouter des sons
                    </h3>
                    {tracksFromSelectedPlaylists.length > 0 && (
                      <button
                        type="button"
                        className={buttonClassName({ variant: "ghost", size: "sm" })}
                        onClick={() =>
                          setSelectedTrackIds((current) => [
                            ...new Set([
                              ...current,
                              ...tracksFromSelectedPlaylists.map((track) => track.id),
                            ]),
                          ])
                        }
                      >
                        Ajouter tous les sons visibles
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher un titre ou un artiste"
                      className="rounded-xl border border-white/10 bg-[#11111d] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/50"
                    />
                    {(searching || searchResults.length > 0) && (
                      <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                        {searching ? (
                          <p className="text-sm text-slate-500">Recherche...</p>
                        ) : (
                          searchResults.map((track) => (
                            <TrackToggle
                              key={track.id}
                              track={track}
                              selected={selectedTrackSet.has(track.id)}
                              onToggle={() => toggleTrack(track.id)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {tracksFromSelectedPlaylists.length > 0 && (
                    <details className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                        Voir les morceaux des playlists sélectionnées
                      </summary>
                      <div className="grid max-h-72 gap-2 overflow-y-auto border-t border-white/10 p-4 md:grid-cols-2">
                        {tracksFromSelectedPlaylists.map((track) => (
                          <TrackToggle
                            key={track.id}
                            track={track}
                            selected={selectedTrackSet.has(track.id)}
                            onToggle={() => toggleTrack(track.id)}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              <aside className="border-t border-white/10 bg-black/20 p-5 lg:border-l lg:border-t-0">
                <div className="sticky top-24 grid gap-4">
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                      Mix final
                    </p>
                    <strong className="mt-2 block text-4xl font-black text-white">
                      {estimatedTrackCount}
                    </strong>
                    <span className="text-sm text-slate-400">titre(s) jouable(s)</span>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-300">
                      <div className="rounded-xl bg-black/25 p-3">
                        <strong className="block text-lg text-white">
                          {selectedPlaylistIds.length}
                        </strong>
                        playlists
                      </div>
                      <div className="rounded-xl bg-black/25 p-3">
                        <strong className="block text-lg text-white">
                          {selectedTrackIds.length}
                        </strong>
                        sons ajoutés
                      </div>
                    </div>
                  </div>

                  {selectedPlaylists.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Playlists sélectionnées
                      </h3>
                      <div className="mt-3 grid gap-2">
                        {selectedPlaylists.map((playlist) => (
                          <button
                            key={playlist.id}
                            type="button"
                            onClick={() => togglePlaylist(playlist.id)}
                            className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2 text-left text-sm font-bold text-white"
                          >
                            <span className="truncate">{playlist.name || "Playlist sans nom"}</span>
                            <span className="text-slate-500">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTracks.length > 0 && (
                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                        Sons ajoutés
                      </h3>
                      <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">
                        {selectedTracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => toggleTrack(track.id)}
                            className="rounded-xl bg-black/25 px-3 py-2 text-left text-xs font-bold text-white"
                          >
                            <span className="block truncate">{track.title}</span>
                            <span className="block truncate text-slate-500">
                              {track.artist} · retirer
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>

          <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
              Réponses
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <ChoiceCard
                active={answerMode === "choices"}
                title="QCM"
                description="Quatre réponses proposées"
                onClick={() => setAnswerMode("choices")}
              />
              <ChoiceCard
                active={answerMode === "text"}
                title="Blind test écrit"
                description="Les joueurs écrivent leur réponse"
                onClick={() => setAnswerMode("text")}
              />
            </div>
            {answerMode === "text" && (
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ["title", "Titre"],
                  ["artist", "Artiste"],
                  ["both", "Les deux"],
                  ["separate", "Points séparés"],
                ].map(([value, label]) => (
                  <ChoiceCard
                    key={value}
                    active={answerTarget === value}
                    title={label}
                    description=""
                    onClick={() =>
                      setAnswerTarget(value as "title" | "artist" | "both" | "separate")
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-3">
            <SelectField
              label="Rounds"
              value={roundCount}
              onChange={setRoundCount}
              options={[5, 10, 15, 20, 30]}
              suffix=" rounds"
            />
            {mode !== "solo" && (
              <SelectField
                label="Joueurs max"
                value={maxPlayers}
                onChange={setMaxPlayers}
                options={[2, 4, 6, 8, 10]}
                suffix=" joueurs"
              />
            )}
            <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
              Difficulté
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
                className="rounded-xl border border-white/10 bg-[#151525] px-3 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-violet-300/50"
              >
                {DIFFICULTIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} · {item.desc}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <button
            type="button"
            className={buttonClassName({ size: "lg" })}
            disabled={!canCreate}
            onClick={createGame}
          >
            Lancer la partie
          </button>
        </div>
      )}

      {tab === "join" && (
        <section className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="text-5xl">🔑</div>
          <h2 className="mt-4 text-2xl font-black text-white">Rejoindre avec un code</h2>
          <p className="mt-2 text-slate-400">Entre le code fourni par l’hôte.</p>
          <form onSubmit={joinByCode} className="mt-6 grid gap-3">
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="A1B2C3"
              maxLength={8}
              className="rounded-2xl border border-white/10 bg-[#11111d] px-5 py-4 text-center text-2xl font-black uppercase tracking-[0.4em] text-white outline-none focus:border-violet-300/50"
            />
            <button
              type="submit"
              className={buttonClassName({ size: "lg" })}
              disabled={!joinCode.trim()}
            >
              Rejoindre
            </button>
          </form>
        </section>
      )}

      {tab === "public" && (
        <section className="grid gap-4 lg:grid-cols-2">
          {publicGames.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center lg:col-span-2">
              <div className="text-5xl">🎮</div>
              <p className="mt-4 text-slate-400">Aucune partie publique en attente.</p>
              <button
                className={buttonClassName({ variant: "ghost", className: "mt-4" })}
                onClick={() => setTab("create")}
              >
                Créer une partie →
              </button>
            </div>
          ) : (
            publicGames.map((game) => {
              const gameCard = game as GameData & {
                isOfficial?: boolean;
                name?: string | null;
                playlist?: { coverUrl?: string | null } | null;
              };
              const title = gameCard.name || game.playlistName;
              const coverUrl = gameCard.playlist?.coverUrl;
              return (
                <div
                  key={game.id}
                  className={`group grid overflow-hidden rounded-3xl border shadow-2xl shadow-black/20 transition hover:-translate-y-1 md:grid-cols-[150px_1fr] ${
                    gameCard.isOfficial
                      ? "border-amber-300/30 bg-amber-500/10 hover:border-amber-200/50"
                      : "border-white/10 bg-white/[0.03] hover:border-violet-300/35 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className={`relative min-h-40 overflow-hidden ${
                      gameCard.isOfficial ? "bg-amber-400/10" : "bg-violet-500/10"
                    }`}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full min-h-40 w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.35),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(124,58,237,0.35),transparent_40%)]">
                        <span className="text-4xl font-black text-white/80">♪</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    {gameCard.isOfficial && (
                      <span className="absolute left-3 top-3 rounded-full border border-amber-200/50 bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 backdrop-blur">
                        Officiel
                      </span>
                    )}
                  </div>

                  <div className="flex min-h-56 flex-col justify-between gap-5 p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!gameCard.isOfficial && (
                          <span className="rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-200">
                            Public
                          </span>
                        )}
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {game.answerMode === "text" ? "Écrit" : "QCM"}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${publicGameStatusClass(game.status)}`}
                        >
                          {publicGameStatusLabel(game.status)}
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-2xl font-black leading-tight text-white">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-slate-400">
                        {gameCard.name ? game.playlistName : "Playlist publique"}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-400">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                          <strong className="block text-base text-white">
                            {game.playerCount}/{game.maxPlayers}
                          </strong>
                          joueurs
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                          <strong className="block text-base text-white">{game.roundCount}</strong>
                          rounds
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                          <strong className="block text-base text-white">
                            {Math.round(game.roundDurationMs / 1000)}s
                          </strong>
                          round
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                          {gameCard.isOfficial
                            ? "Créée par BlindMedley"
                            : `Créée par ${game.hostUsername}`}
                        </p>
                        <Form route="game.join" routeParams={{ id: game.id }}>
                          {() => (
                            <button
                              type="button"
                              className={buttonClassName()}
                              onClick={() => {
                                void unlockAudio().then(() =>
                                  router.post(routeUrl("game.join", { params: { id: game.id } })),
                                );
                              }}
                            >
                              {game.status === "waiting" ? "Rejoindre" : "Rejoindre en cours"}
                            </button>
                          )}
                        </Form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}

function TrackToggle({
  track,
  selected,
  onToggle,
}: {
  track: TrackOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl border p-2 text-left transition ${
        selected
          ? "border-emerald-300/50 bg-emerald-500/15"
          : "border-white/10 bg-white/[0.03] hover:border-violet-300/30"
      }`}
    >
      <div className="h-11 w-11 overflow-hidden rounded-lg bg-violet-500/20">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{track.title}</p>
        <p className="truncate text-xs text-slate-400">{track.artist}</p>
      </div>
      <span className="text-lg">{selected ? "✓" : "+"}</span>
    </button>
  );
}

function ChoiceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-violet-300/60 bg-violet-500/15"
          : "border-white/10 bg-black/20 hover:border-violet-300/30"
      }`}
    >
      <strong className="text-white">{title}</strong>
      {description && <span className="mt-1 block text-sm text-slate-400">{description}</span>}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: number[];
  suffix: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border border-white/10 bg-[#151525] px-3 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-violet-300/50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
            {suffix}
          </option>
        ))}
      </select>
    </label>
  );
}
