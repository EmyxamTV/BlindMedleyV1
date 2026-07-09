import { Link } from "@adonisjs/inertia/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buttonClassName } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAudioVolume } from "~/hooks/use_audio_volume";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface PartyTrack extends Record<string, JSONDataTypes> {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  previewUrl: string;
  playlistId: string;
  playlistName: string;
}

interface PartyPlaylist extends Record<string, JSONDataTypes> {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  trackCount: number;
  tracks: PartyTrack[];
}

interface Props extends InertiaProps {
  playlists: PartyPlaylist[];
  preselectedPlaylistId: string | null;
}

type Phase = "setup" | "ready" | "playing" | "paused" | "revealed" | "finished";
type HistoryEntry = PartyTrack & { startedAt: number; revealed: boolean };

const DEFAULT_ROUND_SECONDS = 25;
const DEFAULT_REVEAL_SECONDS = 7;

export default function PartyMode({ playlists, preselectedPlaylistId }: Props) {
  const [volume, setVolume] = useAudioVolume();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(() =>
    preselectedPlaylistId ? [preselectedPlaylistId] : playlists.slice(0, 2).map((playlist) => playlist.id),
  );
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [roundSeconds, setRoundSeconds] = useState(DEFAULT_ROUND_SECONDS);
  const [revealSeconds, setRevealSeconds] = useState(DEFAULT_REVEAL_SECONDS);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [sessionTracks, setSessionTracks] = useState<PartyTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_ROUND_SECONDS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [visualSeed, setVisualSeed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const selectedPlaylistSet = useMemo(() => new Set(selectedPlaylistIds), [selectedPlaylistIds]);
  const availableTracks = useMemo(
    () => playlists.flatMap((playlist) => playlist.tracks).filter((track) => selectedPlaylistSet.has(track.playlistId)),
    [playlists, selectedPlaylistSet],
  );
  const selectedTrackSet = useMemo(() => new Set(selectedTrackIds), [selectedTrackIds]);
  const visibleTracks = useMemo(() => {
    const normalized = normalize(search);
    if (!normalized) return availableTracks;
    return availableTracks.filter((track) =>
      normalize(`${track.title} ${track.artist} ${track.album ?? ""} ${track.playlistName}`).includes(normalized),
    );
  }, [availableTracks, search]);
  const selectedTracks = useMemo(
    () => availableTracks.filter((track) => selectedTrackSet.has(track.id)),
    [availableTracks, selectedTrackSet],
  );
  const currentTrack = sessionTracks[currentIndex] ?? null;
  const timerProgress = Math.max(0, Math.min(100, (timeLeft / roundSeconds) * 100));
  const sessionProgress = sessionTracks.length > 0 ? ((currentIndex + 1) / sessionTracks.length) * 100 : 0;

  useEffect(() => {
    setSelectedTrackIds((current) => {
      const available = new Set(availableTracks.map((track) => track.id));
      const kept = current.filter((id) => available.has(id));
      return kept.length === current.length ? current : kept;
    });
  }, [availableTracks]);

  useEffect(() => {
    return () => {
      clearTimers();
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (phase !== "playing") return;

    clearIntervalTimer();
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (currentTrack) {
            clearIntervalTimer();
            audioRef.current?.pause();
            setPhase("revealed");
            setHistory((historyEntries) =>
              historyEntries.map((entry) =>
                entry.id === currentTrack.id && entry.startedAt === currentIndex
                  ? { ...entry, revealed: true }
                  : entry,
              ),
            );

            if (autoAdvance) {
              clearRevealTimer();
              revealTimerRef.current = window.setTimeout(() => nextTrack(), revealSeconds * 1000);
            }
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return clearIntervalTimer;
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvance, currentIndex, currentTrack, phase, revealSeconds]);

  function clearIntervalTimer() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function clearRevealTimer() {
    if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = null;
  }

  function clearTimers() {
    clearIntervalTimer();
    clearRevealTimer();
  }

  function togglePlaylist(playlistId: string) {
    setSelectedPlaylistIds((current) =>
      current.includes(playlistId)
        ? current.filter((id) => id !== playlistId)
        : [...current, playlistId],
    );
  }

  function toggleTrack(trackId: string) {
    setSelectedTrackIds((current) =>
      current.includes(trackId) ? current.filter((id) => id !== trackId) : [...current, trackId],
    );
  }

  function selectAllVisibleTracks() {
    setSelectedTrackIds((current) => {
      const next = new Set(current);
      const allVisibleSelected = visibleTracks.length > 0 && visibleTracks.every((track) => next.has(track.id));
      for (const track of visibleTracks) {
        if (allVisibleSelected) next.delete(track.id);
        else next.add(track.id);
      }
      return [...next];
    });
  }

  function buildTrackPool() {
    const pool = selectedTrackIds.length > 0 ? selectedTracks : availableTracks;
    const deduped = new Map<string, PartyTrack>();
    for (const track of pool) deduped.set(track.id, track);
    const tracks = [...deduped.values()];
    return shuffleEnabled ? shuffle(tracks) : tracks;
  }

  function startSession() {
    const tracks = buildTrackPool();
    if (tracks.length === 0) return;
    clearTimers();
    audioRef.current?.pause();
    setSessionTracks(tracks);
    setCurrentIndex(0);
    setHistory([]);
    setTimeLeft(roundSeconds);
    setVisualSeed((value) => value + 1);
    setPhase("ready");
  }

  async function playTrack(index = currentIndex, fromStart = true) {
    const track = sessionTracks[index];
    if (!track) return;
    clearRevealTimer();

    let audio = audioRef.current;
    if (!audio || audio.src !== new URL(track.previewUrl, window.location.origin).href) {
      audio?.pause();
      audio = new Audio(track.previewUrl);
      audio.volume = volume / 100;
      audioRef.current = audio;
    }

    if (fromStart) audio.currentTime = 0;
    setPhase("ready");
    setCurrentIndex(index);
    if (fromStart || index !== currentIndex) setTimeLeft(roundSeconds);
    setVisualSeed((value) => value + 1);

    try {
      await audio.play();
      setHistory((current) => {
        if (current.some((entry) => entry.id === track.id && entry.startedAt === index)) return current;
        return [{ ...track, startedAt: index, revealed: false }, ...current];
      });
      setPhase("playing");
    } catch {
      setPhase("paused");
    }
  }

  function pauseSession() {
    audioRef.current?.pause();
    setPhase("paused");
  }

  function nextTrack() {
    clearTimers();
    audioRef.current?.pause();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionTracks.length) {
      setPhase("finished");
      return;
    }

    if (autoAdvance) void playTrack(nextIndex, true);
    else {
      setCurrentIndex(nextIndex);
      setTimeLeft(roundSeconds);
      setPhase("ready");
    }
  }

  async function toggleFullscreen() {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await stageRef.current.requestFullscreen();
  }

  const canStart = buildTrackPool().length > 0;

  return (
    <div ref={stageRef} className="min-h-[calc(100vh-90px)] bg-[#07070d] text-slate-100">
      {phase === "setup" ? (
        <SetupScreen
          playlists={playlists}
          selectedPlaylistIds={selectedPlaylistIds}
          availableTracks={availableTracks}
          visibleTracks={visibleTracks}
          selectedTrackIds={selectedTrackIds}
          search={search}
          roundSeconds={roundSeconds}
          revealSeconds={revealSeconds}
          autoAdvance={autoAdvance}
          shuffleEnabled={shuffleEnabled}
          volume={volume}
          canStart={canStart}
          onTogglePlaylist={togglePlaylist}
          onToggleTrack={toggleTrack}
          onSelectAllVisibleTracks={selectAllVisibleTracks}
          onSearch={setSearch}
          onRoundSeconds={setRoundSeconds}
          onRevealSeconds={setRevealSeconds}
          onAutoAdvance={setAutoAdvance}
          onShuffle={setShuffleEnabled}
          onVolume={setVolume}
          onStart={startSession}
        />
      ) : (
        <GameScreen
          currentTrack={currentTrack}
          currentIndex={currentIndex}
          totalTracks={sessionTracks.length}
          phase={phase}
          timeLeft={timeLeft}
          timerProgress={timerProgress}
          sessionProgress={sessionProgress}
          history={history}
          visualSeed={visualSeed}
          isFullscreen={isFullscreen}
          autoAdvance={autoAdvance}
          onPlay={() => void playTrack(currentIndex, phase === "ready")}
          onPause={pauseSession}
          onNext={nextTrack}
          onSetup={() => {
            clearTimers();
            audioRef.current?.pause();
            setPhase("setup");
          }}
          onFullscreen={() => void toggleFullscreen()}
        />
      )}
    </div>
  );
}

function SetupScreen({
  playlists,
  selectedPlaylistIds,
  availableTracks,
  visibleTracks,
  selectedTrackIds,
  search,
  roundSeconds,
  revealSeconds,
  autoAdvance,
  shuffleEnabled,
  volume,
  canStart,
  onTogglePlaylist,
  onToggleTrack,
  onSelectAllVisibleTracks,
  onSearch,
  onRoundSeconds,
  onRevealSeconds,
  onAutoAdvance,
  onShuffle,
  onVolume,
  onStart,
}: {
  playlists: PartyPlaylist[];
  selectedPlaylistIds: string[];
  availableTracks: PartyTrack[];
  visibleTracks: PartyTrack[];
  selectedTrackIds: string[];
  search: string;
  roundSeconds: number;
  revealSeconds: number;
  autoAdvance: boolean;
  shuffleEnabled: boolean;
  volume: number;
  canStart: boolean;
  onTogglePlaylist: (playlistId: string) => void;
  onToggleTrack: (trackId: string) => void;
  onSelectAllVisibleTracks: () => void;
  onSearch: (value: string) => void;
  onRoundSeconds: (value: number) => void;
  onRevealSeconds: (value: number) => void;
  onAutoAdvance: (value: boolean) => void;
  onShuffle: (value: boolean) => void;
  onVolume: (value: number) => void;
  onStart: () => void;
}) {
  const selectedPlaylistCount = selectedPlaylistIds.length;
  const selectedCount = selectedTrackIds.length;
  const finalTrackCount = selectedCount > 0 ? selectedCount : availableTracks.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Mode soirée</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
            Blindtest salon
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Prépare une session comme une vidéo YouTube : plusieurs playlists, musiques choisies à
            la main, aucun champ de réponse. Les invités répondent à voix haute.
          </p>
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Retour aux playlists
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">1. Choisis les playlists</h2>
              <p className="text-sm text-slate-400">{selectedPlaylistCount} sélectionnée(s)</p>
            </div>
            <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-200">
              {availableTracks.length} extraits
            </span>
          </div>
          <div className="mt-4 grid max-h-[460px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {playlists.map((playlist) => {
              const selected = selectedPlaylistIds.includes(playlist.id);
              return (
                <button
                  key={playlist.id}
                  type="button"
                  aria-label={`${selected ? "Retirer" : "Ajouter"} la playlist ${playlist.name}`}
                  onClick={() => onTogglePlaylist(playlist.id)}
                  className={`group overflow-hidden rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-violet-300/60 bg-violet-500/15 shadow-lg shadow-violet-950/20"
                      : "border-white/10 bg-black/20 hover:border-violet-300/30"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5">
                      {playlist.coverUrl ? (
                        <img src={playlist.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🎵</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-white">{playlist.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {playlist.tracks.length} extrait(s) utilisable(s)
                      </p>
                      <p className="mt-2 text-xs font-bold text-violet-200">
                        {selected ? "Sélectionnée" : "Ajouter à la session"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-black text-white">2. Réglages avant lancement</h2>
          <div className="mt-5 grid gap-5">
            <RangeSetting label="Durée par extrait" value={roundSeconds} min={10} max={60} step={5} suffix="s" onChange={onRoundSeconds} />
            <RangeSetting label="Affichage de la réponse" value={revealSeconds} min={3} max={15} step={1} suffix="s" onChange={onRevealSeconds} />
            <RangeSetting label="Volume" value={volume} min={0} max={100} step={1} suffix="%" onChange={onVolume} />
            <ToggleSetting label="Mélanger les musiques" checked={shuffleEnabled} onChange={onShuffle} />
            <ToggleSetting label="Enchaînement automatique" checked={autoAdvance} onChange={onAutoAdvance} />
          </div>
          <div className="mt-6 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
            <p className="text-sm text-slate-300">
              Session prête avec <strong className="text-white">{finalTrackCount}</strong> musique(s).
              {selectedCount === 0 && " Sans sélection manuelle, toutes les musiques des playlists choisies seront utilisées."}
            </p>
            <button
              type="button"
              className={buttonClassName({ size: "lg", className: "mt-4 w-full" })}
              disabled={!canStart}
              onClick={onStart}
            >
              Lancer la soirée
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-lg font-black text-white">3. Ajouter des musiques précises</h2>
            <p className="text-sm text-slate-400">
              Optionnel : si tu coches des musiques, seules celles-ci seront utilisées.
            </p>
          </div>
          <button
            type="button"
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            disabled={visibleTracks.length === 0}
            onClick={onSelectAllVisibleTracks}
          >
            Sélection visible
          </button>
        </div>
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Filtrer par titre, artiste, album ou playlist..."
          className="mt-4 text-white"
        />
        <div className="mt-4 grid max-h-[430px] gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {visibleTracks.map((track) => {
            const selected = selectedTrackIds.includes(track.id);
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onToggleTrack(track.id)}
                className={`grid grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-2xl border p-3 text-left transition ${
                  selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/5">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">🎵</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{track.title}</p>
                  <p className="truncate text-xs text-slate-400">{track.artist}</p>
                  <p className="truncate text-xs text-violet-200">{track.playlistName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GameScreen({
  currentTrack,
  currentIndex,
  totalTracks,
  phase,
  timeLeft,
  timerProgress,
  sessionProgress,
  history,
  visualSeed,
  isFullscreen,
  autoAdvance,
  onPlay,
  onPause,
  onNext,
  onSetup,
  onFullscreen,
}: {
  currentTrack: PartyTrack | null;
  currentIndex: number;
  totalTracks: number;
  phase: Phase;
  timeLeft: number;
  timerProgress: number;
  sessionProgress: number;
  history: HistoryEntry[];
  visualSeed: number;
  isFullscreen: boolean;
  autoAdvance: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onSetup: () => void;
  onFullscreen: () => void;
}) {
  const bars = useMemo(
    () => Array.from({ length: 34 }, (_, index) => 24 + ((index * 17 + visualSeed * 11) % 86)),
    [visualSeed],
  );

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#05050a] px-4 py-4 text-slate-100 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(168,85,247,0.34),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(217,70,239,0.18),transparent_26%),radial-gradient(circle_at_85%_72%,rgba(34,211,238,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-400/10 animate-[ping_4.8s_cubic-bezier(0,0,0.2,1)_infinite]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="relative flex min-h-full w-full flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Mode soirée</p>
            <h1 className="text-2xl font-black text-white md:text-4xl">Blindtest salon</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClassName({ variant: "secondary" })} onClick={onFullscreen}>
              {isFullscreen ? "Quitter fullscreen" : "Fullscreen"}
            </button>
            <button type="button" className={buttonClassName({ variant: "ghost" })} onClick={onSetup}>
              Réglages
            </button>
          </div>
        </header>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-5 text-center shadow-2xl shadow-violet-950/30 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                {phase === "finished" ? "Terminé" : `Morceau ${currentIndex + 1}/${totalTracks}`}
              </span>
              <span className="rounded-full bg-black/30 px-4 py-2 text-sm font-black text-violet-200">
                {autoAdvance ? "Auto" : "Manuel"}
              </span>
            </div>

            <div className="mt-8 flex min-h-[430px] flex-col items-center justify-center text-center">
              {phase === "finished" ? (
                <div className="w-full max-w-5xl">
                  <div className="animate-[pulse_1.8s_ease-in-out_infinite]">
                    <div className="text-7xl">🏁</div>
                    <h2 className="mt-6 text-5xl font-black text-white">Session terminée</h2>
                    <p className="mt-3 text-slate-400">Voici l’historique complet de la partie.</p>
                  </div>

                  <div className="mt-8 max-h-[42vh] space-y-2 overflow-y-auto pr-1 text-left">
                    {history.length === 0 ? (
                      <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                        Aucun morceau joué.
                      </p>
                    ) : (
                      history.map((track) => (
                        <div
                          key={`${track.startedAt}-${track.id}`}
                          className="grid gap-3 rounded-2xl border border-violet-300/30 bg-violet-400/10 p-4 md:grid-cols-[1fr_auto]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-base font-black text-white">{track.title}</p>
                            <p className="truncate text-sm text-slate-400">{track.artist}</p>
                          </div>
                          <p className="self-center truncate text-xs font-black uppercase tracking-[0.14em] text-violet-200">
                            {track.playlistName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : phase === "revealed" && currentTrack ? (
                <div className="animate-[fadeIn_0.35s_ease-out]">
                  <div className="mx-auto h-56 w-56 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-fuchsia-950/30">
                    {currentTrack.coverUrl ? (
                      <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-7xl">🎵</div>
                    )}
                  </div>
                  <h2 className="mt-8 text-4xl font-black text-white md:text-7xl">{currentTrack.title}</h2>
                  <p className="mt-4 text-2xl font-bold text-violet-200 md:text-4xl">{currentTrack.artist}</p>
                  {currentTrack.album && <p className="mt-2 text-slate-400">{currentTrack.album}</p>}
                </div>
              ) : (
                <div className="w-full">
                  <div className="relative mx-auto flex h-72 w-72 items-center justify-center md:h-96 md:w-96">
                    <div className="absolute inset-0 rounded-full border border-violet-400/30 bg-violet-500/10 animate-[ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute inset-8 rounded-full border border-fuchsia-400/20 animate-[spin_18s_linear_infinite]" />
                    <div
                      className="absolute inset-3 rounded-full bg-[conic-gradient(from_90deg,rgba(217,70,239,0.95),rgba(139,92,246,0.85),rgba(34,211,238,0.9),rgba(255,255,255,0.08),rgba(217,70,239,0.95))] opacity-80 blur-[1px] transition-transform duration-700"
                      style={{ transform: `rotate(${(100 - timerProgress) * 3.6}deg)` }}
                    />
                    <div className="absolute inset-6 rounded-full bg-[#080710]" />
                    <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-white/10 bg-black/40 text-8xl font-black text-white shadow-2xl shadow-violet-950/40 md:h-64 md:w-64 md:text-9xl">
                      {timeLeft}
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-violet-200">
                    {phase === "paused" ? "En pause" : phase === "ready" ? "Prêt" : "secondes"}
                  </p>
                  <div className="mx-auto mt-10 flex h-28 max-w-3xl items-end justify-center gap-2">
                    {bars.map((height, index) => (
                      <span
                        key={`${visualSeed}-${index}`}
                        className={`w-2 rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400 ${
                          phase === "playing" ? "animate-pulse" : "opacity-40"
                        }`}
                        style={{
                          height: `${height}%`,
                          animationDelay: `${(index % 9) * 70}ms`,
                          transition: "height 280ms ease",
                        }}
                      />
                    ))}
                  </div>
                  <h2 className="mt-8 text-4xl font-black text-white md:text-6xl">Devinez le morceau</h2>
                  <p className="mt-3 text-slate-400">Répondez à voix haute, comme devant une vidéo blindtest.</p>
                </div>
              )}
            </div>

            {phase !== "finished" && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {phase === "playing" ? (
                  <button type="button" className={buttonClassName({ variant: "secondary", size: "lg" })} onClick={onPause}>
                    Pause
                  </button>
                ) : phase === "revealed" ? (
                  <button type="button" className={buttonClassName({ size: "lg" })} onClick={onNext}>
                    Morceau suivant
                  </button>
                ) : (
                  <button type="button" className={buttonClassName({ size: "lg" })} onClick={onPlay}>
                    {phase === "paused" ? "Reprendre" : "Lancer"}
                  </button>
                )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

function RangeSetting({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-300">
      <span className="flex justify-between">
        {label}
        <strong className="text-white">
          {value}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-violet-500"
      />
    </label>
  );
}

function ToggleSetting({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-slate-300">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-violet-500"
      />
    </label>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
