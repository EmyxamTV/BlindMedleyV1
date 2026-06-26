import { useEffect, useState } from "react";
import type { GamePlayerData } from "~/types";

export type AnswerPing = {
  userId: number;
  responseMs: number;
  isCorrect?: boolean;
};

export function Timer({
  endsAt,
  serverNow,
  durationMs,
  pings,
  players,
}: {
  endsAt: number;
  serverNow: number;
  durationMs: number;
  pings: AnswerPing[];
  players: GamePlayerData[];
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const clockOffset = serverNow - Date.now();
    const update = () => {
      const nextRemaining = Math.max(0, endsAt - (Date.now() + clockOffset));
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) clearInterval(interval);
    };
    const interval = setInterval(update, 100);
    update();
    return () => clearInterval(interval);
  }, [endsAt, serverNow]);

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
            className={`answer-ping ${ping.isCorrect === false ? "wrong" : ""}`}
            style={{
              left: `${Math.min(98, Math.max(2, 100 - (ping.responseMs / durationMs) * 100))}%`,
            }}
          >
            <span className="answer-ping-name">
              {players.find((player) => player.userId === ping.userId)?.username ?? "Joueur"}
            </span>
            <i />
          </span>
        ))}
      </div>
      <span className="timer-secs">{secs}s</span>
    </div>
  );
}
