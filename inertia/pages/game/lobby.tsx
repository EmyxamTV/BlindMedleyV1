import { useEffect, useRef, useState } from "react";
import { Form, Link } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { Transmit } from "@adonisjs/transmit-client";
import { useLeaveBeacon } from "~/hooks/use_leave_beacon";
import { buttonClassName } from "~/components/ui/button";
import { routeUrl } from "~/lib/routes";
import type { GamePlayerData, GameWithPlayers, InertiaProps } from "~/types";
import { createRealtimeUid } from "~/lib/realtime";

interface Props extends InertiaProps {
  game: GameWithPlayers;
  isHost: boolean;
  canModerate: boolean;
}

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function unlockAudio() {
  const audio = new Audio(SILENT_WAV);
  audio.play().catch(() => {});
}

function timestampFromDate(value: unknown) {
  if (!value) return null;
  const timestamp = new Date(String(value)).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export default function Lobby({ game, isHost, canModerate, user }: Props) {
  const gameAutoStartsAt = (game as GameWithPlayers & { autoStartsAt?: string | null })
    .autoStartsAt;
  const [players, setPlayers] = useState<GamePlayerData[]>(game.players);
  const [autoStartsAt, setAutoStartsAt] = useState<number | null>(timestampFromDate(gameAutoStartsAt));
  const [now, setNow] = useState(Date.now());
  const countdownSyncTriggered = useRef(false);
  const canStart = isHost || canModerate;
  const needsMorePlayers = game.mode !== "solo" && players.length < 2;
  const isOfficial = Boolean((game as GameWithPlayers & { isOfficial?: boolean }).isOfficial);
  const countdownSeconds =
    autoStartsAt === null ? null : Math.max(0, Math.ceil((autoStartsAt - now) / 1000));

  useLeaveBeacon(routeUrl("game.leave", { params: { id: game.id } }));

  useEffect(() => {
    const transmit = new Transmit({
      baseUrl: window.location.origin,
      uidGenerator: createRealtimeUid,
    });
    const subscription = transmit.subscription(`game/${game.id}`);

    subscription.create().then(() => {
      subscription.onMessage<{ event: string; autoStartsAt?: number }>((message) => {
        if (message.event === "game_starting") {
          unlockAudio();
          router.visit(routeUrl("game.play", { params: { id: game.id } }));
        }
        if (message.event === "official_countdown_started") {
          setAutoStartsAt(Number(message.autoStartsAt));
        }
        if (message.event === "official_countdown_cancelled") {
          setAutoStartsAt(null);
        }
        if (message.event === "game_stopped" || message.event === "game_deleted") {
          router.visit(routeUrl("game.index"));
        }
        if (message.event === "players_updated" || message.event === "game_updated") {
          router.reload({ only: ["game"] });
        }
      });
    });

    return () => {
      subscription.delete();
    };
  }, [game.id]);

  useEffect(() => {
    setPlayers(game.players);
    setAutoStartsAt(timestampFromDate(gameAutoStartsAt));
    countdownSyncTriggered.current = false;
    if (game.status !== "waiting") {
      unlockAudio();
      router.visit(routeUrl("game.play", { params: { id: game.id } }));
    }
  }, [game.id, game.players, game.status, gameAutoStartsAt]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoStartsAt === null || countdownSyncTriggered.current || game.status !== "waiting") return;
    if (autoStartsAt > now) return;

    countdownSyncTriggered.current = true;
    router.reload({ only: ["game"] });
  }, [autoStartsAt, game.status, now]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">Lobby</p>
          <h1 className="mt-2 text-4xl font-black text-white">
            {(game as GameWithPlayers & { name?: string | null }).name || game.playlistName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-slate-300">
            <span className="rounded-full border border-violet-300/20 bg-violet-500/15 px-3 py-1 uppercase">
              {game.mode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              {game.roundCount} rounds
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              {game.roundDurationMs / 1000}s par round
            </span>
          </div>
        </div>

        {game.code && (
          <div className="rounded-2xl border border-violet-300/30 bg-violet-500/15 px-5 py-4 text-center">
            <span className="block text-xs font-black uppercase tracking-[0.2em] text-violet-200">
              Code d’invitation
            </span>
            <span className="mt-1 block text-3xl font-black tracking-[0.18em] text-white">
              {game.code}
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
            Joueurs ({players.length}/{game.maxPlayers})
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 ${
                  !player.isConnected ? "opacity-50" : ""
                }`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-500/25 font-black text-white">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    player.username[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{player.username}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {player.userId === game.hostId && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-200">
                        Hôte
                      </span>
                    )}
                    {user && player.userId === user.id && (
                      <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-200">
                        Vous
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {Array.from({ length: Math.max(0, game.maxPlayers - players.length) }, (_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-black/10 p-3 text-slate-600"
              >
                <div className="h-11 w-11 rounded-full bg-white/[0.04]" />
                <span className="font-bold">En attente...</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          {isOfficial && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                Partie officielle
              </p>
              {countdownSeconds !== null ? (
                <>
                  <p className="mt-2 text-sm font-bold text-slate-300">
                    Lancement automatique dans
                  </p>
                  <p className="mt-1 text-4xl font-black text-white">{countdownSeconds}s</p>
                </>
              ) : (
                <p className="mt-2 text-sm font-bold text-slate-400">
                  En attente du premier joueur.
                </p>
              )}
            </div>
          )}

          {canStart ? (
            <Form route="game.start" routeParams={{ id: game.id }}>
              {() => (
                <button
                  type="submit"
                  className={buttonClassName({ size: "xl", className: "w-full" })}
                  disabled={!canModerate && needsMorePlayers}
                  onClick={unlockAudio}
                >
                  {isHost ? "Démarrer la partie" : "Forcer le lancement"}
                </button>
              )}
            </Form>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-300/30 border-t-violet-300" />
              <p className="mt-3 text-sm font-bold text-slate-400">
                En attente que l’hôte démarre...
              </p>
            </div>
          )}

          {needsMorePlayers && !canModerate && (
            <p className="text-center text-xs font-bold text-slate-500">
              Il faut au moins 2 joueurs pour lancer cette partie.
            </p>
          )}

          <Link route="playlists.index" className={buttonClassName({ variant: "ghost", className: "w-full" })}>
            Quitter
          </Link>

          {canModerate && (
            <div className="grid gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
                Actions admin
              </p>
              <div className="grid gap-2">
                <Form route="game.stop" routeParams={{ id: game.id }}>
                  {() => (
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/25"
                    >
                      Stopper la partie
                    </button>
                  )}
                </Form>
                <Form route="game.destroy" routeParams={{ id: game.id }}>
                  {() => (
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-300/30 bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-500"
                    >
                      Supprimer la partie
                    </button>
                  )}
                </Form>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
