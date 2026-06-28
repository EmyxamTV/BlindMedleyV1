import { Link } from "@adonisjs/inertia/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "~/components/game/audio_player";
import { buttonClassName } from "~/components/ui/button";
import { useAudioVolume } from "~/hooks/use_audio_volume";
import type { InertiaProps } from "~/types";

type Choice = { id: string; title: string; artist: string };
type Question = { correctTrackId: string; previewUrl: string; choices: Choice[] };

export default function Practice(_: InertiaProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useAudioVolume();
  const [playKey, setPlayKey] = useState(0);
  const startedAt = useRef(Date.now());
  const nextQuestionTimer = useRef<number | null>(null);

  const loadQuestion = useCallback(async () => {
    setQuestion(null);
    setAnswered(null);
    setFeedback(null);
    setError(null);
    try {
      const response = await fetch("/practice/question", {
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Impossible de charger un titre.");
      startedAt.current = Date.now();
      setQuestion(data as Question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger un titre.");
    }
  }, []);

  useEffect(() => {
    void loadQuestion();
  }, [loadQuestion]);

  useEffect(
    () => () => {
      if (nextQuestionTimer.current !== null) window.clearTimeout(nextQuestionTimer.current);
    },
    [],
  );

  function listen() {
    setError(null);
    setPlayKey((value) => value + 1);
  }

  function answer(choice: Choice) {
    if (!question || answered !== null) return;
    setAnswered(choice.id);
    const correct = choice.id === question.correctTrackId;
    if (correct) {
      const earned = Math.max(100, 1_000 - Math.floor((Date.now() - startedAt.current) / 12));
      setScore((current) => current + earned);
      setStreak((current) => current + 1);
      setFeedback(`Bien joué ! +${earned} points`);
    } else {
      const solution = question.choices.find((item) => item.id === question.correctTrackId);
      setStreak(0);
      setFeedback(`Pas cette fois - c'était ${solution?.title} · ${solution?.artist}`);
    }
    nextQuestionTimer.current = window.setTimeout(() => void loadQuestion(), 1_800);
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div>
          <span className="eyebrow">MODE SOLO</span>
          <h1>Échauffement musical</h1>
          <p>Un extrait, quatre réponses. Enchaîne les titres à ton rythme.</p>
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Parties multijoueur
        </Link>
      </header>

      <section className="practice-board">
        <aside className="practice-stats">
          <div>
            <span>Score</span>
            <strong>{score.toLocaleString("fr-FR")}</strong>
          </div>
          <div>
            <span>Série</span>
            <strong>{streak > 0 ? `×${streak}` : "-"}</strong>
          </div>
        </aside>

        <main className="practice-question">
          {error ? (
            <div className="practice-empty">
              <p>{error}</p>
              <button className={buttonClassName()} onClick={() => void loadQuestion()}>
                Réessayer
              </button>
            </div>
          ) : !question ? (
            <div className="practice-empty">
              <div className="spinner-large" />
              <p>Préparation de l'extrait...</p>
            </div>
          ) : (
            <>
              <AudioPlayer
                key={question.previewUrl}
                previewUrl={question.previewUrl}
                volume={volume}
                onVolumeChange={setVolume}
                autoPlay={false}
                playKey={playKey}
              />
              <div className="mt-4 mb-6 flex justify-center">
                <button className={buttonClassName()} disabled={answered !== null} onClick={listen}>
                  ▶ Écouter l'extrait
                </button>
              </div>
              <div className="choices-grid practice-choices">
                {question.choices.map((choice) => {
                  const isCorrect = answered !== null && choice.id === question.correctTrackId;
                  const isWrong = answered === choice.id && !isCorrect;
                  return (
                    <button
                      key={choice.id}
                      className={`choice-btn ${isCorrect ? "practice-correct" : ""} ${isWrong ? "practice-wrong" : ""}`}
                      disabled={answered !== null}
                      onClick={() => answer(choice)}
                    >
                      <span className="choice-title">{choice.title}</span>
                      <span className="choice-artist">{choice.artist}</span>
                    </button>
                  );
                })}
              </div>
              {feedback && (
                <div
                  className={`practice-feedback ${answered === question.correctTrackId ? "correct" : "incorrect"}`}
                >
                  {feedback}
                </div>
              )}
              {answered !== null && (
                <button
                  className={buttonClassName({ className: "practice-next" })}
                  onClick={() => void loadQuestion()}
                >
                  Titre suivant →
                </button>
              )}
            </>
          )}
        </main>
      </section>
    </div>
  );
}
