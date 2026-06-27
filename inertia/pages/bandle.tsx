import { Link } from "@adonisjs/inertia/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClassName } from "~/components/ui/button";
import type { InertiaProps } from "~/types";

type Choice = { id: string; title: string; artist: string };
type Question = { correctTrackId: string; previewUrl: string; choices: Choice[] };
const MAX_ATTEMPTS = 5;

export default function Bandle(_: InertiaProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [result, setResult] = useState<"correct" | "lost" | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const stopTimer = useRef<number | null>(null);
  const load = useCallback(async () => {
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    setQuestion(null);
    setAttempt(1);
    setResult(null);
    setError(null);
    setAudioError(null);
    try {
      const res = await fetch("/practice/question", { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Impossible de charger un morceau.");
      setQuestion(data as Question);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger un morceau.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(
    () => () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
    },
    [],
  );
  async function listen() {
    if (!audio.current) return;
    setAudioError(null);
    audio.current.currentTime = 0;
    try {
      await audio.current.play();
    } catch {
      void load();
      return;
    }
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => audio.current?.pause(), attempt * 1000);
  }
  function answer(choice: Choice) {
    if (!question || result) return;
    if (choice.id === question.correctTrackId) {
      setScore((value) => value + 1_500 - (attempt - 1) * 250);
      setResult("correct");
      audio.current?.pause();
      return;
    }
    if (attempt === MAX_ATTEMPTS) {
      setResult("lost");
      audio.current?.pause();
    } else setAttempt((value) => value + 1);
  }
  const solution = question?.choices.find((choice) => choice.id === question.correctTrackId);
  return (
    <div className="bandle-page">
      <header className="bandle-head">
        <div>
          <span className="eyebrow">MODE PROGRESSIF</span>
          <h1>Devine avant d’en entendre trop.</h1>
          <p>Chaque erreur révèle une seconde supplémentaire.</p>
        </div>
        <b>{score.toLocaleString("fr-FR")} pts</b>
        <Link route="practice.index" className={buttonClassName({ variant: "ghost" })}>
          Entraînement
        </Link>
      </header>
      <main className="bandle-card">
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
            <audio
              ref={audio}
              src={question.previewUrl}
              preload="auto"
              onError={() => void load()}
            />
            <div className="bandle-stage">
              <span>EXTRAIT {attempt}</span>
              <strong>
                {attempt} seconde{attempt > 1 ? "s" : ""}
              </strong>
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
                  key={choice.id}
                  disabled={Boolean(result)}
                  onClick={() => answer(choice)}
                  className={`choice-btn ${result && choice.id === question.correctTrackId ? "practice-correct" : ""}`}
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
