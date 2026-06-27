import { Form, Link } from "@adonisjs/inertia/react";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";
import { buttonClassName } from "~/components/ui/button";
import type { GameData, GamePlayerData, InertiaProps } from "~/types";

interface HistoryPlayer extends Record<string, JSONDataTypes> {
  userId: string;
  username: string;
  avatarUrl: string | null;
  won: boolean;
  scoreEarned: number;
}

interface HistoryTrack extends Record<string, JSONDataTypes> {
  roundNumber: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  players: HistoryPlayer[];
}

interface Props extends InertiaProps {
  game: GameData & { id: string };
  players: GamePlayerData[];
  myXpEarned: number;
  history: HistoryTrack[];
}

const podiumOrder = [2, 1, 3] as const;

const rankLabel = (rank: number | null) => {
  if (!rank) return "-";
  if (rank === 1) return "1er";
  return `${rank}e`;
};

const podiumColumnClass = {
  1: "min-h-[310px] border-amber-300/65 bg-linear-to-b from-amber-300/40 to-amber-500/10 shadow-[0_18px_46px_rgba(251,191,36,0.15)]",
  2: "min-h-[255px] border-slate-200/50 bg-linear-to-b from-slate-100/30 to-slate-400/10",
  3: "min-h-[220px] border-[#c2855a]/60 bg-linear-to-b from-[#c2855a]/35 to-[#c2855a]/10",
};

const rankClass = {
  1: "text-amber-300",
  2: "text-slate-100",
  3: "text-[#d99a6c]",
};

export default function Results({ game, players, myXpEarned, history }: Props) {
  const me = players.find((player) => player.isMe);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="text-center">
        <span className="text-xs font-extrabold tracking-[0.14em] text-violet-300 uppercase">
          Partie terminée
        </span>
        <h1 className="mt-1 text-4xl leading-none font-black sm:text-5xl">Podium final</h1>
        <p className="mt-2 text-sm text-[#8b8ba8]">{game.playlistName}</p>
      </header>

      <section
        className="grid min-h-[390px] grid-cols-1 items-end gap-4 sm:grid-cols-3"
        aria-label="Podium final"
      >
        {podiumOrder.map((rank) => {
          const player = players.find((candidate) => candidate.rank === rank);

          return (
            <article key={rank} className="flex min-w-0 flex-col items-center justify-end gap-3">
              <div
                className={`flex min-h-[142px] w-full flex-col items-center gap-1.5 text-center ${player ? "" : "opacity-45"}`}
              >
                <div
                  className={`grid place-items-center overflow-hidden rounded-full bg-linear-135 from-[#7c3aed] to-[#ec4899] font-black text-white shadow-[0_10px_24px_rgba(124,58,237,0.3)] ${
                    rank === 1 ? "h-[86px] w-[86px] ring-3 ring-amber-300/35" : "h-[68px] w-[68px]"
                  }`}
                >
                  {player?.avatarUrl ? (
                    <img className="h-full w-full object-cover" src={player.avatarUrl} alt="" />
                  ) : (
                    <span>{player ? player.username[0].toUpperCase() : "-"}</span>
                  )}
                </div>
                <span className="max-w-full overflow-hidden text-sm font-extrabold text-ellipsis whitespace-nowrap">
                  {player?.username ?? "Place libre"}
                </span>
                <span className="text-sm font-extrabold text-violet-200 tabular-nums">
                  {player ? `${player.score} pts` : "0 pt"}
                </span>
                {player?.isMe && (
                  <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[0.66rem] font-extrabold text-violet-200 uppercase">
                    Vous
                  </span>
                )}
              </div>

              <div
                className={`grid w-full place-items-center rounded-t-2xl rounded-b-sm border ${podiumColumnClass[rank]}`}
              >
                <strong className={`text-2xl font-black ${rankClass[rank]}`}>
                  {rankLabel(rank)}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      {me && (
        <section className="rounded-2xl border border-violet-300/25 bg-violet-500/10 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat value={me.score} label="points" />
            <Stat value={me.bestStreak} label="meilleure série" />
            <Stat value={`+${myXpEarned}`} label="XP" />
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="rounded-2xl border border-white/[0.07] bg-[#0f0f1a] p-4">
          <h2 className="mb-3 text-xs font-extrabold tracking-[0.08em] text-[#8b8ba8] uppercase">
            Historique des musiques
          </h2>
          <div className="grid gap-3">
            {history.map((track) => (
              <article
                key={track.roundNumber}
                className="grid items-center gap-4 rounded-xl bg-white/[0.035] p-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {track.coverUrl ? (
                    <img
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                      src={track.coverUrl}
                      alt=""
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200">
                      ♪
                    </span>
                  )}
                  <div className="min-w-0">
                    <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">
                      {track.title}
                    </strong>
                    <span className="block overflow-hidden text-sm text-ellipsis whitespace-nowrap text-[#55556a]">
                      {track.artist}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  {track.players.map((player) => (
                    <span
                      key={player.userId}
                      className={`rounded-full px-2 py-1 text-xs font-extrabold ${
                        player.won
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-red-500/15 text-red-200"
                      }`}
                    >
                      {player.username}
                      {player.won ? ` +${player.scoreEarned}` : " perdu"}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/[0.07] bg-[#0f0f1a] p-4">
        <h2 className="mb-3 text-xs font-extrabold tracking-[0.08em] text-[#8b8ba8] uppercase">
          Classement complet
        </h2>
        <div className="grid gap-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`grid min-h-[52px] grid-cols-[38px_34px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2 sm:grid-cols-[44px_36px_minmax(0,1fr)_auto_auto] ${
                player.isMe ? "bg-violet-500/15" : "bg-white/[0.035]"
              }`}
            >
              <span className="font-black text-violet-200">{rankLabel(player.rank)}</span>
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-linear-135 from-[#7c3aed] to-[#ec4899] text-xs font-black text-white">
                {player.avatarUrl ? (
                  <img className="h-full w-full object-cover" src={player.avatarUrl} alt="" />
                ) : (
                  player.username[0].toUpperCase()
                )}
              </span>
              <span className="flex min-w-0 items-center gap-2 overflow-hidden font-extrabold text-ellipsis whitespace-nowrap">
                {player.username}
                {player.isMe && (
                  <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[0.66rem] font-extrabold text-violet-200 uppercase">
                    Vous
                  </span>
                )}
              </span>
              <strong className="whitespace-nowrap tabular-nums">{player.score} pts</strong>
              <span className="hidden whitespace-nowrap text-sm text-[#55556a] sm:inline">
                {player.correct}/{player.correct + player.incorrect} correctes
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Form route="game.replay" routeParams={{ id: game.id }}>
          {() => (
            <button type="submit" className={buttonClassName()}>
              Rejouer
            </button>
          )}
        </Form>
        <Link route="leaderboard.index" className={buttonClassName({ variant: "ghost" })}>
          Classement général
        </Link>
        <Link route="profile.show" className={buttonClassName({ variant: "ghost" })}>
          Mon profil
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.045] p-3">
      <strong className="block text-xl tabular-nums">{value}</strong>
      <span className="block text-xs font-extrabold tracking-[0.08em] text-[#55556a] uppercase">
        {label}
      </span>
    </div>
  );
}
