import { useEffect, useRef, useState } from "react";
import type { GamePlayerData } from "~/types";

export type AnswerPing = {
  userId: string;
  responseMs: number;
  isCorrect?: boolean;
};

export function Timer({
  startsAt,
  endsAt,
  serverNow,
  durationMs,
  pings,
  players,
  paused = false,
  onExpire,
}: {
  startsAt?: number;
  endsAt: number;
  serverNow: number;
  durationMs: number;
  pings: AnswerPing[];
  players: GamePlayerData[];
  paused?: boolean;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(0);
  const expiredEndsAtRef = useRef<number | null>(null);

  useEffect(() => {
    const effectiveStartsAt = startsAt ?? endsAt - durationMs;
    if (paused) {
      setRemaining(serverNow < effectiveStartsAt ? durationMs : Math.max(0, endsAt - serverNow));
      return;
    }

    const clockOffset = serverNow - Date.now();
    const update = () => {
      const now = Date.now() + clockOffset;
      const nextRemaining = now < effectiveStartsAt ? durationMs : Math.max(0, endsAt - now);
      setRemaining(nextRemaining);
      if (now >= endsAt) {
        clearInterval(interval);
        if (expiredEndsAtRef.current !== endsAt) {
          expiredEndsAtRef.current = endsAt;
          onExpire?.();
        }
      }
    };
    const interval = setInterval(update, 100);
    update();
    return () => clearInterval(interval);
  }, [durationMs, endsAt, onExpire, paused, serverNow, startsAt]);

  const pct = Math.min(100, (remaining / durationMs) * 100);
  const secs = Math.ceil(remaining / 1000);
  const urgent = secs <= 5;

  return (
    <div className={`timer ${urgent ? "urgent" : ""}`}>
      <div className="timer-bar-wrap">
        <div className="timer-bar" style={{ width: `${pct}%` }} />
        {pings.map((ping) => (
          <span
            key={ping.userId}
            className={`answer-ping group !pointer-events-auto hover:!z-50 ${ping.isCorrect === false ? "wrong" : ""}`}
            style={{
              left: `${Math.min(98, Math.max(2, 100 - (ping.responseMs / durationMs) * 100))}%`,
            }}
          >
            <span className="answer-ping-name transition group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-2xl">
              {players.find((player) => player.userId === ping.userId)?.username ?? "Joueur"}
            </span>
            <i className="!absolute !left-1/2 !top-[-8px] !block !h-0 !w-0 !-translate-x-1/2 !border-x-[6px] !border-t-[7px] !border-x-transparent !border-t-teal-600 group-[.wrong]:!border-t-rose-600" />
          </span>
        ))}
      </div>
      <span className="timer-secs">{paused ? "Pause" : `${secs}s`}</span>
    </div>
  );
}
