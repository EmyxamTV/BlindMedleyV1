import { Form, Link } from "@adonisjs/inertia/react";
import type { InertiaProps } from "~/types";

interface PlayerResult {
  rank: number | null;
  username: string;
  avatarUrl: string | null;
  score: number;
  correct: number;
  incorrect: number;
  bestStreak: number;
  xpEarned: number;
  isMe: boolean;
}

interface Props extends InertiaProps {
  game: {
    id: string;
    mode: string;
    playlistName: string;
    roundCount: number;
    finishedAt: string | null;
  };
  players: PlayerResult[];
  myXpEarned: number;
}

const rankEmoji = (rank: number | null) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export default function Results({ game, players, myXpEarned }: Props) {
  const me = players.find((p) => p.isMe);

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Résultats</h1>
        <p className="results-playlist">{game.playlistName}</p>
      </div>

      {me && (
        <div className="my-result-card">
          <div className="my-result-rank">{rankEmoji(me.rank)}</div>
          <div className="my-result-stats">
            <span className="my-score">{me.score} points</span>
            <span className="my-accuracy">
              {me.correct}/{me.correct + me.incorrect} correctes (
              {me.correct + me.incorrect > 0
                ? Math.round((me.correct / (me.correct + me.incorrect)) * 100)
                : 0}
              %)
            </span>
            <span className="my-streak">Meilleure série : {me.bestStreak}</span>
          </div>
          <div className="my-xp">
            <span className="xp-gained">+{myXpEarned} XP</span>
          </div>
        </div>
      )}

      <div className="podium">
        {players.slice(0, Math.min(3, players.length)).map((p) => (
          <div key={p.username} className={`podium-slot rank-${p.rank} ${p.isMe ? "is-me" : ""}`}>
            <div className="podium-avatar">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" />
              ) : (
                <span>{p.username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="podium-rank">{rankEmoji(p.rank)}</div>
            <div className="podium-name">{p.username}</div>
            <div className="podium-score">{p.score} pts</div>
          </div>
        ))}
      </div>

      <table className="results-table">
        <thead>
          <tr>
            <th>Rang</th>
            <th>Joueur</th>
            <th>Score</th>
            <th>Précision</th>
            <th>Meilleure série</th>
            <th>XP</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.username} className={p.isMe ? "me-row" : ""}>
              <td>{rankEmoji(p.rank)}</td>
              <td className="player-cell">
                {p.avatarUrl && <img src={p.avatarUrl} alt="" className="table-avatar" />}
                {p.username}
                {p.isMe && <span className="you-badge">Vous</span>}
              </td>
              <td>
                <strong>{p.score}</strong>
              </td>
              <td>
                {p.correct}/{p.correct + p.incorrect}{" "}
                <span className="muted">
                  (
                  {p.correct + p.incorrect > 0
                    ? Math.round((p.correct / (p.correct + p.incorrect)) * 100)
                    : 0}
                  %)
                </span>
              </td>
              <td>🔥 {p.bestStreak}</td>
              <td className="xp-cell">+{p.xpEarned}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="results-actions">
        <Form route="game.replay" routeParams={{ id: game.id }}>
          {() => (
            <button type="submit" className="btn btn-primary">
              Rejouer
            </button>
          )}
        </Form>
        <Link route="leaderboard.index" className="btn btn-ghost">
          Classement général
        </Link>
        <Link route="profile.show" className="btn btn-ghost">
          Mon profil
        </Link>
      </div>
    </div>
  );
}
