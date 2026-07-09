import { useCallback, useEffect, useRef, useState } from "react";
import { Form } from "@adonisjs/inertia/react";
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
  canModerate: boolean;
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
  nextGameId?: string | null;
  nextAutoStartsAt?: number | null;
  scores?: GamePlayerData[];
  answerPings?: AnswerPing[];
  answerProgress?: AnswerProgress[];
  history?: TrackHistory[];
};

function answerPlaceholder(target: string) {
  if (target === "title") return "Écris le titre...";
  if (target === "artist") return "Écris l’artiste...";
  if (target === "separate") return "Titre ou artiste...";
  return "Titre et artiste...";
}

export default function Play({
  game,
  myPlayer: initialMyPlayer,
  round,
  history: initialHistory,
  serverNow,
  canModerate,
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
  const [officialRestartAt, setOfficialRestartAt] = useState<number | null>(
    game.autoStartsAt ? new Date(String(game.autoStartsAt)).getTime() : null,
  );
  const [now, setNow] = useState(Date.now());
  const textInputRef = useRef<HTMLInputElement>(null);
  const isPaused = gameStatus === "paused";
  const currentRoundNumber = currentRound?.roundNumber ?? null;
  const currentRoundNumberRef = useRef<number | null>(currentRoundNumber);
  const isOfficialGame = Boolean((game as GameWithPlayers & { isOfficial?: boolean }).isOfficial);

  useLeaveBeacon(routeUrl("game.leave", { params: { id: game.id } }));

  useEffect(() => {
    currentRoundNumberRef.current = currentRoundNumber;
  }, [currentRoundNumber]);

  useEffect(() => {
    if (game.answerMode !== "text" || currentRoundNumber === null) return;
    setTextAnswer("");
    const focusInput = () => textInputRef.current?.focus({ preventScroll: true });
    const timers = [50, 250, 600].map((delay) => window.setTimeout(focusInput, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [currentRoundNumber, game.answerMode]);

  const syncGameState = useCallback(async () => {
    try {
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
        if (isOfficialGame) {
          setGameStatus("finished");
          setCurrentRound(null);
          setOfficialRestartAt(data.nextAutoStartsAt ?? null);
        } else {
          router.visit(routeUrl("game.results", { params: { id: game.id } }));
        }
        return;
      }
      if (data.status === "cancelled") {
        router.visit(routeUrl("game.index"));
        return;
      }
      if (data.status === "waiting" || data.status === "starting") {
        setGameStatus(data.status);
        if (data.status === "waiting") setCurrentRound(null);
      }
      if (data.status === "paused") setGameStatus("paused");
      if (data.status === "active") setGameStatus("active");
      if (data.round) {
        const activeRoundNumber = currentRoundNumberRef.current;
        if (!activeRoundNumber || data.round.roundNumber > activeRoundNumber) {
          setCurrentRound(data.round);
          setAnswered(false);
          setLastResult(null);
          setRevealed(null);
          setAnswerPings([]);
          setAnswerProgress({});
          setGameStatus(data.status === "paused" ? "paused" : "active");
        } else if (data.round.roundNumber === activeRoundNumber) {
          setCurrentRound((round) =>
            round ? { ...round, ...data.round, serverNow: data.serverNow } : data.round,
          );
        }
      }
    } catch {
      // Les events temps réel ou le prochain resync discret reprennent le relais.
    }
  }, [game.id, initialMyPlayer.userId, isOfficialGame]);

  const handleTimerExpire = useCallback(() => {
    void syncGameState();
  }, [syncGameState]);

  useEffect(() => {
    void syncGameState();

    const interval = window.setInterval(() => {
      void syncGameState();
    }, 30_000);

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void syncGameState();
    };

    document.addEventListener("visibilitychange", syncWhenVisible);
    window.addEventListener("focus", syncWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.removeEventListener("focus", syncWhenVisible);
      window.clearInterval(interval);
    };
  }, [syncGameState]);

  useEffect(() => {
    if (currentRound !== null && gameStatus !== "starting" && gameStatus !== "waiting") return;

    const interval = window.setInterval(() => {
      void syncGameState();
    }, isOfficialGame ? 2_500 : 1_500);

    return () => window.clearInterval(interval);
  }, [currentRound, gameStatus, isOfficialGame, syncGameState]);

  useEffect(() => {
    if (!isOfficialGame || gameStatus !== "finished") return;
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    const resync = window.setInterval(() => {
      void syncGameState();
    }, 2_000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(resync);
    };
  }, [gameStatus, isOfficialGame, syncGameState]);

  useEffect(() => {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: createRealtimeUid,
    });
    const subscription = transmit.subscription(`game/${game.id}`);

    subscription.create().then(() => {
      subscription.onMessage<{ event: string } & Record<string, unknown>>((message) => {
        const activeRoundNumber = currentRoundNumberRef.current;
        if (message.event === "round_started") {
          const { event: _, ...roundData } = message;
          setCurrentRound(roundData as ClientRound);
          setOfficialRestartAt(null);
          setAnswered(false);
          setLastResult(null);
          setRevealed(null);
          setAnswerPings([]);
          setAnswerProgress({});
          setGameStatus("active");
        } else if (message.event === "game_starting") {
          setGameStatus("starting");
          setCurrentRound(null);
          setOfficialRestartAt(null);
        } else if (message.event === "official_game_reset") {
          setGameStatus("waiting");
          setCurrentRound(null);
          setAnswered(false);
          setLastResult(null);
          setRevealed(null);
          setAnswerPings([]);
          setAnswerProgress({});
        } else if (
          message.event === "answer_submitted" &&
          message.roundNumber === activeRoundNumber
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
          setCurrentRound((round) =>
            round
              ? {
                  ...round,
                  endsAt: Date.now(),
                  serverNow: Date.now(),
                }
              : round,
          );
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
          message.roundNumber === activeRoundNumber
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
          if (isOfficialGame) {
            setCurrentRound(null);
            setOfficialRestartAt((message.nextAutoStartsAt as number | null | undefined) ?? null);
          } else {
            router.visit(routeUrl("game.results", { params: { id: game.id } }));
          }
        } else if (message.event === "game_paused") {
          setGameStatus("paused");
          void syncGameState();
        } else if (message.event === "game_resumed") {
          const { event: _, ...roundData } = message;
          if (roundData.roundNumber) setCurrentRound(roundData as ClientRound);
          setGameStatus("active");
        } else if (message.event === "game_stopped" || message.event === "game_deleted") {
          router.visit(routeUrl("game.index"));
        }
      });
    });

    return () => {
      subscription.delete();
    };
  }, [game.id, initialMyPlayer.userId, isOfficialGame, syncGameState]);

  const handleAnswer = useCallback(
    async (choice: RoundChoice | string) => {
      if (answered || !currentRound || isPaused) return;
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
            choiceToken: typeof choice === "string" ? undefined : choice.choiceToken,
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
      isPaused,
    ],
  );

  if (isOfficialGame && gameStatus === "finished") {
    const seconds = officialRestartAt ? Math.max(0, Math.ceil((officialRestartAt - now) / 1000)) : null;
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 text-slate-100">
        <div className="w-full max-w-xl rounded-3xl border border-amber-300/20 bg-amber-500/10 p-8 text-center shadow-2xl shadow-amber-950/20">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-200">
            Partie officielle
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">La partie est terminée</h1>
          <p className="mt-3 text-sm font-bold text-slate-400">
            Reste ici, la prochaine manche va se relancer automatiquement.
          </p>
          <div className="mx-auto mt-6 grid h-28 w-28 place-items-center rounded-full border border-amber-200/30 bg-black/25 text-4xl font-black text-white">
            {seconds === null ? "—" : `${seconds}s`}
          </div>
          <button
            type="button"
            onClick={() => void syncGameState()}
            className="mt-6 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-black text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            Synchroniser
          </button>
        </div>
      </div>
    );
  }

  if (!currentRound || gameStatus === "waiting" || gameStatus === "starting") {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
          <p className="mt-4 font-black text-white">Préparation du round...</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            La musique est en cours de préparation côté serveur.
          </p>
        </div>
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
        {canModerate && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <span className="px-2">Admin</span>
              {isPaused ? (
                <Form route="game.resume" routeParams={{ id: game.id }}>
                  {() => (
                    <button
                      type="submit"
                      className="rounded-full px-2.5 py-1 text-emerald-300 transition hover:bg-emerald-400/10 hover:text-emerald-100"
                      title="Reprendre la partie"
                    >
                      Reprendre
                    </button>
                  )}
                </Form>
              ) : (
                <Form route="game.pause" routeParams={{ id: game.id }}>
                  {() => (
                    <button
                      type="submit"
                      className="rounded-full px-2.5 py-1 text-amber-300 transition hover:bg-amber-400/10 hover:text-amber-100"
                      title="Mettre la partie en pause"
                    >
                      Pause
                    </button>
                  )}
                </Form>
              )}
              <Form route="game.stop" routeParams={{ id: game.id }}>
                {() => (
                  <button
                    type="submit"
                    className="rounded-full px-2.5 py-1 text-slate-400 transition hover:bg-red-400/10 hover:text-red-200"
                    title="Stopper la partie"
                  >
                    Stop
                  </button>
                )}
              </Form>
              <Form route="game.destroy" routeParams={{ id: game.id }}>
                {() => (
                  <button
                    type="submit"
                    className="rounded-full px-2.5 py-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
                    title="Supprimer la partie"
                  >
                    Suppr.
                  </button>
                )}
              </Form>
            </div>
          </div>
        )}

        <div className="round-header">
          <span className="round-num">
            Round {currentRound.roundNumber}/{game.roundCount}
          </span>
          <Timer
            startsAt={currentRound.startsAt}
            endsAt={currentRound.endsAt}
            serverNow={currentRound.serverNow ?? serverNow}
            durationMs={game.roundDurationMs}
            pings={answerPings}
            players={scores}
            paused={isPaused}
            onExpire={handleTimerExpire}
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
            disabled={answered || isPaused}
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
            disabled={isPaused}
            scheduledStartAt={currentRound.startsAt}
            scheduledEndAt={currentRound.endsAt}
            serverNow={currentRound.serverNow ?? serverNow}
          />
        ) : (
          <div className="audio-card">
            <span style={{ fontSize: "2rem" }}>♪</span>
            <span className="audio-hint">Pas d’extrait disponible — devine au titre</span>
          </div>
        )}

        {revealed && (
          <div className="round-reveal">
            <span className="reveal-label">C’était :</span>
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
                <span>Bonne réponse ! +{lastResult.scoreEarned} pts</span>
              </>
            ) : lastResult.partial ? (
              <>
                <span className="result-icon">OK</span>
                <span>
                  {lastResult.partialFound === "title" ? "Titre trouvé" : "Artiste trouvé"} ! +
                  {lastResult.scoreEarned} pts
                </span>
              </>
            ) : (
              <>
                <span className="result-icon">X</span>
                <span>Mauvaise réponse</span>
              </>
            )}
          </div>
        )}

        {isPaused && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/15 p-4 text-center text-sm font-black text-amber-100">
            Partie en pause par un administrateur.
          </div>
        )}

        {game.answerMode !== "text" && (
          <div className="choices-grid">
            {currentRound.choices.map((choice) => (
              <button
                key={choice.choiceToken}
                className={`choice-btn ${answered || isPaused ? "disabled" : ""}`}
                onClick={() => handleAnswer(choice)}
                disabled={answered || isPaused}
              >
                <span className="choice-title">{choice.title}</span>
                <span className="choice-artist">{choice.artist}</span>
              </button>
            ))}
          </div>
        )}

        {answered && !lastResult && (
          <p className="answered-waiting">Réponse enregistrée. En attente du résultat...</p>
        )}
      </main>
    </div>
  );
}
