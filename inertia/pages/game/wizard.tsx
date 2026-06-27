import { Form, Link } from "@adonisjs/inertia/react";
import { useState } from "react";
import { DifficultyDots } from "~/components/difficulty_dots";
import { WizardOptionGroup, type WizardOption } from "~/components/game/wizard_option_group";
import { Button, buttonClassName } from "~/components/ui/button";
import type { InertiaProps, PlaylistData } from "~/types";

interface Props extends InertiaProps {
  playlist: PlaylistData;
}

type Mode = "solo" | "public" | "private";
type AnswerMode = "choices" | "text";
type AnswerTarget = "title" | "artist" | "both" | "separate";

const modes: { value: Mode; label: string; desc: string }[] = [
  { value: "solo", label: "Solo", desc: "Jouer seul" },
  { value: "public", label: "Public", desc: "Rejoignable par tous" },
  { value: "private", label: "Privé", desc: "Avec un code" },
];

const answerModes: { value: AnswerMode; label: string; desc: string }[] = [
  { value: "choices", label: "QCM", desc: "Quatre propositions" },
  { value: "text", label: "Blind test", desc: "Réponse libre" },
];

const answerTargets: { value: AnswerTarget; label: string; desc: string }[] = [
  { value: "title", label: "Titre", desc: "Trouver le titre" },
  { value: "artist", label: "Artiste", desc: "Trouver l’artiste" },
  { value: "both", label: "Les deux", desc: "Titre et artiste requis" },
  { value: "separate", label: "Points séparés", desc: "Score titre + artiste" },
];

const difficulties: readonly WizardOption[] = [
  { value: "1", label: "Facile", description: "30 secondes" },
  { value: "2", label: "Normal", description: "25 secondes" },
  { value: "3", label: "Difficile", description: "20 secondes" },
  { value: "4", label: "Expert", description: "15 secondes" },
  { value: "5", label: "Légendaire", description: "10 secondes" },
];

const maxPlayerCounts: readonly WizardOption[] = ["2", "4", "6", "8", "10"].map((value) => ({
  value,
  label: `${value} joueurs`,
  description: "Maximum",
}));

const secondsByDifficulty: Record<string, number> = {
  "1": 30,
  "2": 25,
  "3": 20,
  "4": 15,
  "5": 10,
};

function estimatedDuration(roundCount: string, difficulty: string) {
  const seconds = Number(roundCount) * (secondsByDifficulty[difficulty] ?? 25);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} secondes`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`;
}

export default function GameWizard({ playlist }: Props) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("solo");
  const [answerMode, setAnswerMode] = useState<AnswerMode>("choices");
  const [answerTarget, setAnswerTarget] = useState<AnswerTarget>("both");
  const [difficulty, setDifficulty] = useState(String(playlist.difficulty || 2));
  const [roundCount, setRoundCount] = useState("10");
  const [maxPlayers, setMaxPlayers] = useState("8");

  const steps = [
    "Mode",
    "Réponse",
    ...(answerMode === "text" ? ["Cible"] : []),
    "Options",
  ];
  const lastStep = steps.length - 1;
  const current = steps[step];
  const roundCounts: readonly WizardOption[] = ["5", "10", "15", "20"].map((value) => ({
    value,
    label: `${value} morceaux`,
    description: `Durée estimée ${estimatedDuration(value, difficulty)}`,
  }));

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setStep(0);
  }

  return (
    <div className="game-index">
      <div className="gi-header">
        <div>
          <h1 className="gi-title">Configurer la partie</h1>
          <p className="gi-sub">
            {playlist.name} · {playlist.trackCount} titres · difficulté {playlist.difficulty}/5
          </p>
          <DifficultyDots level={playlist.difficulty} />
        </div>
        <Link route="playlists.index" className={buttonClassName({ variant: "ghost" })}>
          Retour aux playlists
        </Link>
      </div>

      <div className="wizard-stepper" aria-label="Progression">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            className={`wizard-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}
            onClick={() => setStep(index)}
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      {current === "Mode" && (
        <>
          <section className="gi-section">
            <h2 className="gi-section-title">Mode de jeu</h2>
            <div className="mode-grid">
              {modes.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant="ghost"
                  className={`mode-card ${mode === item.value ? "selected" : ""}`}
                  onClick={() => selectMode(item.value)}
                >
                  <span className="mode-card-name">{item.label}</span>
                  <span className="mode-card-desc">{item.desc}</span>
                </Button>
              ))}
            </div>
          </section>
          {mode !== "solo" && (
            <section className="gi-section">
              <WizardOptionGroup
                label="Joueurs max"
                value={maxPlayers}
                options={maxPlayerCounts}
                onChange={setMaxPlayers}
              />
            </section>
          )}
        </>
      )}

      <Form route="game.create">
        {() => (
          <>
            <input type="hidden" name="playlistId" value={playlist.id} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="answerMode" value={answerMode} />
            <input type="hidden" name="answerTarget" value={answerTarget} />
            <input type="hidden" name="difficulty" value={difficulty} />
            <input type="hidden" name="roundCount" value={roundCount} />
            {mode !== "solo" && <input type="hidden" name="maxPlayers" value={maxPlayers} />}

              {current === "Réponse" && (
                <section className="gi-section">
                  <h2 className="gi-section-title">Type de réponse</h2>
                  <div className="mode-grid">
                    {answerModes.map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant="ghost"
                        className={`mode-card ${answerMode === item.value ? "selected" : ""}`}
                        onClick={() => setAnswerMode(item.value)}
                      >
                        <span className="mode-card-name">{item.label}</span>
                        <span className="mode-card-desc">{item.desc}</span>
                      </Button>
                    ))}
                  </div>
                </section>
              )}

              {current === "Cible" && (
                <section className="gi-section">
                  <h2 className="gi-section-title">Réponse à trouver</h2>
                  <div className="mode-grid">
                    {answerTargets.map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant="ghost"
                        className={`mode-card ${answerTarget === item.value ? "selected" : ""}`}
                        onClick={() => setAnswerTarget(item.value)}
                      >
                        <span className="mode-card-name">{item.label}</span>
                        <span className="mode-card-desc">{item.desc}</span>
                      </Button>
                    ))}
                  </div>
                </section>
              )}

              {current === "Options" && (
                <section className="gi-section">
                  <h2 className="gi-section-title">Difficulté et morceaux</h2>
                  <WizardOptionGroup
                    label="Difficulté"
                    value={difficulty}
                    options={difficulties}
                    onChange={setDifficulty}
                  />
                  <WizardOptionGroup
                    label="Morceaux"
                    value={roundCount}
                    options={roundCounts}
                    onChange={setRoundCount}
                  />
                </section>
              )}

              {current === "Options" && (
                <div className="wizard-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((value) => Math.max(value - 1, 0))}
                    disabled={step === 0}
                  >
                    Retour
                  </Button>
                  <Button type="submit">Lancer la partie</Button>
                </div>
              )}
          </>
        )}
      </Form>

      {current !== "Options" && (
        <div className="wizard-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((value) => Math.max(value - 1, 0))}
            disabled={step === 0}
          >
            Retour
          </Button>
          <Button
            type="button"
            onClick={() => setStep((value) => Math.min(value + 1, lastStep))}
          >
            Continuer
          </Button>
        </div>
      )}
    </div>
  );
}
