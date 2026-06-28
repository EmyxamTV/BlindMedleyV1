import { useCallback, useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { Transmit } from "@adonisjs/transmit-client";
import { AudioPlayer } from "~/components/game/audio_player";
import { PlaySidebar, type AnswerProgress } from "~/components/game/play_sidebar";
import { TextAnswerForm } from "~/components/game/text_answer_form";
import { Timer, type AnswerPing } from "~/components/game/timer";
import { TrackLinks } from "~/components/track_links";
import { useAudioVolume } from "~/hooks/use_audio_volume";
import { useLeaveBeacon } from "~/hooks/use_leave_beacon";
import { createRealtimeUid } from "~/lib/realtime";
import { routeUrl } from "~/lib/routes";
import type {
  ClientRound,
  GamePlayerData,
  GameWithPlayers,
  InertiaProps,
  RoundChoice,
  TrackHistory,
} from "~/types";

interface Props extends InertiaProps {
  game: GameWithPlayers;
  myPlayer: GamePlayerData;
  round: ClientRound | null;
  history: TrackHistory[];
  serverNow: number;
}

type LastResult = {
  correct: boolean;
  partial?: boolean;
  partialFound?: "title" | "artist" | null;
  scoreEarned: number;
};

type GameStateResponse = {
  status: string;
  round: ClientRound | null;
  serverNow: number;
  scores?: GamePlayerData[];
  answerPings?: AnswerPing[];
  answerProgress?: AnswerProgress[];
  history?: TrackHistory[];
};

function answerPlaceholder(target: string) {
  if (target === "title") return "Ecris le titre...";
  if (target === "artist") return "Ecris l'artiste...";
  if (target === "separate") return "Titre ou artiste...";
  return "Titre et artiste...";
}

export default function Play({
  game,
  myPlayer: initialMyPlayer,
  round,
  history: initialHistory,
  serverNow,
}: Props) {
  const [answered, setAnswered] = useState(round?.alreadyAnswered ?? false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [scores, setScores] = useState<GamePlayerData[]>(game.players);
  const [myPlayer, setMyPlayer] = useState(initialMyPlayer);
  const [currentRound, setCurrentRound] = useState<ClientRound | null>(round);
  const [gameStatus, setGameStatus] = useState(game.status);
  const [revealed, setRevealed] = useState<TrackHistory | null>(null);
  const [volume, setVolume] = useAudioVolume();
  const [history, setHistory] = useState<TrackHistory[]>(initialHistory);
  const [answerPings, setAnswerPings] = useState<AnswerPing[]>([]);
  const [answerProgress, setAnswerProgress] = useState<Record<number, AnswerProgress>>({});
  const [textAnswer, setTextAnswer] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  useLeaveBeacon(routeUrl("game.leave", { params: { id: game.id } }));

  useEffect(() => {
    if (game.answerMode !== "text" || !currentRound) return;
    setTextAnswer("");
    const focusInput = () => textInputRef.current?.focus({ preventScroll: true });
    const timers = [50, 250, 600].map((delay) => window.setTimeout(focusInput, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [currentRound, game.answerMode, gameStatus]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const res = await fetch(routeUrl("game.state", { params: { id: game.id } }), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = (await res.json()) as GameStateResponse;

      if (data.scores) {
        setScores(data.scores);
        const me = data.scores.find((player) => player.userId === initialMyPlayer.userId);
        if (me) setMyPlayer((previous) => ({ ...previous, ...me }));
      }
      if (data.answerPings) setAnswerPings(data.answerPings);
      if (data.answerProgress) {
        setAnswerProgress(
          Object.fromEntries(data.answerProgress.map((progress) => [progress.userId, progress])),
        );
      }
      if (data.history) setHistory(data.history);
      if (data.status === "finished") {
        router.visit(routeUrl("game.results", { params: { id: game.id } }));
        return;
      }
      if (data.round) {
        if (!currentRound || data.round.roundNumber > currentRound.roundNumber) {
          setCurrentRound(data.round);
          setAnswered(false);
          setLastResult(null);
          setRevealed(null);
          setAnswerPings([]);
          setAnswerProgress({});
          setGameStatus("active");
        } else if (data.round.roundNumber === currentRound.roundNumber) {
          setCurrentRound((round) => (round ? { ...round, serverNow: data.serverNow } : round));
        }
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [game.id, currentRound, initialMyPlayer.userId]);

  useEffect(() => {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: createRealtimeUid,
    });
    const subscription = transmit.subscription(`game/${game.id}`);

    subscription.create().then(() => {
      subscription.onMessage<{ event: string } & Record<string, unknown>>((message) => {
        if (message.event === "round_started") {
          const { event: _, ...roundData } = message;
          setCurrentRound(roundData as ClientRound);
          setAnswered(false);
          setLastResult(null);
          setRevealed(null);
          setAnswerPings([]);
          setAnswerProgress({});
          setGameStatus("active");
        } else if (
          message.event === "answer_submitted" &&
          message.roundNumber === currentRound?.roundNumber
        ) {
          setAnswerPings((current) =>
            current.some((ping) => ping.userId === message.userId)
              ? current
              : [
                  ...current,
                  {
                    userId: message.userId as string,
                    responseMs: message.responseMs as number,
                    isCorrect: message.isCorrect as boolean,
                  },
                ],
          );
        } else if (message.event === "round_revealed") {
          const revealedTrack = {
            roundNumber: message.roundNumber as number,
            title: message.title as string,
            artist: message.artist as string,
            coverUrl: (message.coverUrl as string | null) ?? null,
          };
          setRevealed(revealedTrack);
          setHistory((current) => [
            revealedTrack,
            ...current.filter((track) => track.roundNumber !== revealedTrack.roundNumber),
          ]);
        } else if (
          message.event === "answer_progress" &&
          message.roundNumber === currentRound?.roundNumber
        ) {
          const progress = {
            userId: message.userId as string,
            titleFound: Boolean(message.titleFound),
            artistFound: Boolean(message.artistFound),
          };
          setAnswerProgress((current) => ({ ...current, [progress.userId]: progress }));
        } else if (message.event === "scores_updated") {
          const players = message.players as GamePlayerData[];
          setScores(players);
          const me = players.find((player) => player.userId === initialMyPlayer.userId);
          if (me) setMyPlayer((previous) => ({ ...previous, ...me }));
        } else if (message.event === "game_finished") {
          setGameStatus("finished");
          router.visit(routeUrl("game.results", { params: { id: game.id } }));
        }
      });
    });

    return () => {
      subscription.delete();
    };
  }, [game.id, currentRound?.roundNumber, initialMyPlayer.userId]);

  const handleAnswer = useCallback(
    async (choice: RoundChoice | string) => {
      if (answered || !currentRound) return;
      setAnswered(true);

      try {
        const res = await fetch(routeUrl("game.answer", { params: { id: game.id } }), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN":
              document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
          },
          body: JSON.stringify({
            roundNumber: currentRound.roundNumber,
            answerTrackId: typeof choice === "string" ? undefined : choice.trackId,
            answerText: typeof choice === "string" ? choice : undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) return;

        setLastResult({
          correct: data.correct,
          partial: data.partial,
          partialFound: data.partialFound,
          scoreEarned: data.scoreEarned,
        });
        setTextAnswer("");

        if (game.answerTarget === "separate" && (data.titleFound || data.artistFound)) {
          setAnswerProgress((current) => ({
            ...current,
            [initialMyPlayer.userId]: {
              userId: initialMyPlayer.userId,
              titleFound: Boolean(data.titleFound),
              artistFound: Boolean(data.artistFound),
            },
          }));
        }
        if (game.answerMode === "text" && !data.correct) {
          setAnswered(false);
          window.setTimeout(() => textInputRef.current?.focus({ preventScroll: true }), 50);
        }
        if (data.correct) {
          setAnswerPings((current) =>
            current.some((ping) => ping.userId === initialMyPlayer.userId)
              ? current
              : [
                  ...current,
                  {
                    userId: initialMyPlayer.userId,
                    responseMs: Math.min(
                      game.roundDurationMs,
                      Math.max(0, Date.now() - currentRound.startsAt),
                    ),
                    isCorrect: true,
                  },
                ],
          );
        }

        setMyPlayer((previous) => ({
          ...previous,
          score: previous.score + data.scoreEarned,
          streak: data.correct ? previous.streak + 1 : data.partial ? previous.streak : 0,
          correct: previous.correct + (data.correct ? 1 : 0),
          incorrect: previous.incorrect + (data.correct || data.partial ? 0 : 1),
        }));
        setScores((previous) =>
          previous.map((player) =>
            player.userId === initialMyPlayer.userId
              ? {
                  ...player,
                  score: player.score + data.scoreEarned,
                  streak: data.correct ? player.streak + 1 : data.partial ? player.streak : 0,
                }
              : player,
          ),
        );
      } catch {
        // Network errors are recovered by the polling loop.
      }
    },
    [
      answered,
      currentRound,
      game.answerMode,
      game.answerTarget,
      game.id,
      game.roundDurationMs,
      initialMyPlayer.userId,
    ],
  );

  if (!currentRound || gameStatus === "waiting" || gameStatus === "starting") {
    return (
      <div className="play-waiting">
        <div className="spinner-large" />
        <p>Preparation du round...</p>
      </div>
    );
  }

  return (
    <div className="play-layout">
      <PlaySidebar
        players={scores}
        myUserId={myPlayer.userId}
        answerTarget={game.answerTarget}
        progressByUserId={answerProgress}
        history={history}
      />

      <main className="play-main">
        <div className="round-header">
          <span className="round-num">
            Round {currentRound.roundNumber}/{game.roundCount}
          </span>
          <Timer
            endsAt={currentRound.endsAt}
            serverNow={currentRound.serverNow ?? serverNow}
            durationMs={game.roundDurationMs}
            pings={answerPings}
            players={scores}
          />
          <div className="my-score-mini">
            {myPlayer.score} pts
            {myPlayer.streak >= 2 && <span className="combo">x{myPlayer.streak}</span>}
          </div>
        </div>

        {game.answerMode === "text" && (
          <TextAnswerForm
            compact
            value={textAnswer}
            onChange={setTextAnswer}
            onSubmit={() => void handleAnswer(textAnswer.trim())}
            disabled={answered}
            placeholder={answerPlaceholder(game.answerTarget)}
            inputRef={textInputRef}
          />
        )}

        {currentRound.previewUrl ? (
          <AudioPlayer
            key={currentRound.previewUrl}
            previewUrl={currentRound.previewUrl}
            volume={volume}
            onVolumeChange={setVolume}
          />
        ) : (
          <div className="audio-card">
            <span style={{ fontSize: "2rem" }}>♪</span>
            <span className="audio-hint">Pas d'extrait disponible - devine au titre</span>
          </div>
        )}

        {revealed && (
          <div className="round-reveal">
            <span className="reveal-label">C'etait :</span>
            <span className="reveal-title">{revealed.title}</span>
            <span className="reveal-artist">{revealed.artist}</span>
            <TrackLinks title={revealed.title} artist={revealed.artist} />
          </div>
        )}

        {lastResult && (
          <div
            className={`answer-result ${lastResult.correct || lastResult.partial ? "correct" : "incorrect"}`}
          >
            {lastResult.correct ? (
              <>
                <span className="result-icon">OK</span>
                <span>Bonne reponse ! +{lastResult.scoreEarned} pts</span>
              </>
            ) : lastResult.partial ? (
              <>
                <span className="result-icon">OK</span>
                <span>
                  {lastResult.partialFound === "title" ? "Titre trouve" : "Artiste trouve"} ! +
                  {lastResult.scoreEarned} pts
                </span>
              </>
            ) : (
              <>
                <span className="result-icon">X</span>
                <span>Mauvaise reponse</span>
              </>
            )}
          </div>
        )}

        {game.answerMode === "text" ? (
          <TextAnswerForm
            value={textAnswer}
            onChange={setTextAnswer}
            onSubmit={() => void handleAnswer(textAnswer.trim())}
            disabled={answered}
            placeholder="Ecris ta reponse..."
          />
        ) : (
          <div className="choices-grid">
            {currentRound.choices.map((choice) => (
              <button
                key={choice.choiceToken}
                className={`choice-btn ${answered ? "disabled" : ""}`}
                onClick={() => handleAnswer(choice)}
                disabled={answered}
              >
                <span className="choice-title">{choice.title}</span>
                <span className="choice-artist">{choice.artist}</span>
              </button>
            ))}
          </div>
        )}

        {answered && !lastResult && (
          <p className="answered-waiting">Reponse enregistree. En attente du resultat...</p>
        )}
      </main>
    </div>
  );
}
