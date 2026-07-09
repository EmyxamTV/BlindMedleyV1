import { Link } from "@adonisjs/inertia/react";
import { useCallback, useEffect, useState } from "react";
import { AudioPlayer } from "~/components/game/audio_player";
import { buttonClassName } from "~/components/ui/button";
import { useAudioVolume } from "~/hooks/use_audio_volume";
import type { InertiaProps } from "~/types";

type Choice = { choiceToken: string; title: string; artist: string };
type Question = { correctChoiceToken: string; previewUrl: string; choices: Choice[] };
type PlaylistOption = { id: string; name: string; trackCount: number };

type Props = InertiaProps<{
  playlists: PlaylistOption[];
}>;

const PROGRESSIVE_DURATIONS_MS = [100, 200, 300, 400, 500];
const MAX_ATTEMPTS = PROGRESSIVE_DURATIONS_MS.length;
const PREVIEW_DURATION_MS = 30_000;

export default function Bandle({ playlists }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [result, setResult] = useState<"correct" | "lost" | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolume] = useAudioVolume();
  const [playKey, setPlayKey] = useState(0);
  const [startAtMs, setStartAtMs] = useState(0);

  const load = useCallback(async () => {
    setQuestion(null);
    setAttempt(1);
    setResult(null);
    setError(null);
    setAudioError(null);
    setStartAtMs(0);
    try {
      const url = new URL("/practice/question", window.location.origin);
      if (selectedPlaylistId) url.searchParams.set("playlistId", selectedPlaylistId);

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Impossible de charger un morceau.");
      setQuestion(data as Question);
      setStartAtMs(randomPreviewStartMs());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger un morceau.");
    }
  }, [selectedPlaylistId]);

  useEffect(() => {
    void load();
  }, [load]);

  function changePlaylist(playlistId: string) {
    setScore(0);
    setPlayKey((value) => value + 1);
    setSelectedPlaylistId(playlistId);
  }

  function listen() {
    setAudioError(null);
    setPlayKey((value) => value + 1);
  }

  function answer(choice: Choice) {
    if (!question || result) return;
    if (choice.choiceToken === question.correctChoiceToken) {
      setScore((value) => value + 1_500 - (attempt - 1) * 250);
      setResult("correct");
      return;
    }
    if (attempt === MAX_ATTEMPTS) setResult("lost");
    else setAttempt((value) => value + 1);
  }

  const solution = question?.choices.find((choice) => choice.choiceToken === question.correctChoiceToken);
  const currentDurationMs = PROGRESSIVE_DURATIONS_MS[attempt - 1] ?? PROGRESSIVE_DURATIONS_MS[0];
  const currentDurationLabel = `${(currentDurationMs / 1_000).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  })} seconde`;

  return (
    <div className="bandle-page">
      <header className="bandle-head">
        <div>
          <span className="eyebrow">MODE PROGRESSIF</span>
          <h1>Devine avant d’en entendre trop.</h1>
          <p>Le premier extrait dure 0,1 seconde, puis chaque erreur révèle plus de musique.</p>
        </div>
        <b>{score.toLocaleString("fr-FR")} pts</b>
        <Link route="practice.index" className={buttonClassName({ variant: "ghost" })}>
          Entraînement
        </Link>
      </header>
      <main className="bandle-card">
        <label className="mb-5 grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-slate-400">
          Playlist
          <select
            value={selectedPlaylistId}
            onChange={(event) => changePlaylist(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#151525] px-3 py-2 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-violet-300/50"
          >
            <option value="">Toutes les playlists</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name} ({playlist.trackCount})
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <div className="practice-empty">
            <p>{error}</p>
            <button className={buttonClassName()} onClick={() => void load()}>
              Réessayer
            </button>
          </div>
        ) : !question ? (
          <div className="practice-empty">
            <div className="spinner-large" />
          </div>
        ) : (
          <>
            <AudioPlayer
              previewUrl={question.previewUrl}
              volume={volume}
              onVolumeChange={setVolume}
              autoPlay={false}
              playKey={playKey}
              maxPlayMs={currentDurationMs}
              startAtMs={startAtMs}
              disabled={Boolean(result)}
              onPlayError={() => setAudioError("Impossible de lancer cet extrait.")}
            />
            <div className="bandle-stage">
              <span>EXTRAIT {attempt}</span>
              <strong>{currentDurationLabel}</strong>
              <div>
                {Array.from({ length: MAX_ATTEMPTS }, (_, index) => (
                  <i className={index < attempt ? "on" : ""} key={index} />
                ))}
              </div>
            </div>
            <button
              className={buttonClassName({ className: "bandle-listen" })}
              disabled={Boolean(result)}
              onClick={listen}
            >
              ▶ Écouter l’extrait
            </button>
            {audioError && (
              <p className="bandle-audio-error">
                {audioError} <button onClick={() => void load()}>Nouveau morceau</button>
              </p>
            )}
            <div className="choices-grid bandle-choices">
              {question.choices.map((choice) => (
                <button
                  key={choice.choiceToken}
                  disabled={Boolean(result)}
                  onClick={() => answer(choice)}
                  className={`choice-btn ${result && choice.choiceToken === question.correctChoiceToken ? "practice-correct" : ""}`}
                >
                  <span className="choice-title">{choice.title}</span>
                  <span className="choice-artist">{choice.artist}</span>
                </button>
              ))}
            </div>
            {result && (
              <div className={`bandle-result ${result}`}>
                <strong>{result === "correct" ? "Trouvé !" : "Dommage !"}</strong>
                <span>
                  {solution?.title} · {solution?.artist}
                </span>
                <button className={buttonClassName()} onClick={() => void load()}>
                  Morceau suivant →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function randomPreviewStartMs() {
  const longestExtractMs = PROGRESSIVE_DURATIONS_MS[PROGRESSIVE_DURATIONS_MS.length - 1] ?? 500;
  const maxStartMs = Math.max(0, PREVIEW_DURATION_MS - longestExtractMs - 1_000);
  return Math.floor(Math.random() * maxStartMs);
}
