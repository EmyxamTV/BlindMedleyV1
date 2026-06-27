import { TrackLinks } from "~/components/track_links";
import type { GamePlayerData, TrackHistory } from "~/types";

export type AnswerProgress = {
  userId: string;
  titleFound: boolean;
  artistFound: boolean;
};

export function PlaySidebar({
  players,
  myUserId,
  answerTarget,
  progressByUserId,
  history,
}: {
  players: GamePlayerData[];
  myUserId: string;
  answerTarget: string;
  progressByUserId: Record<string, AnswerProgress>;
  history: TrackHistory[];
}) {
  return (
    <aside className="play-sidebar">
      <h3>Classement</h3>
      {players
        .slice()
        .sort((a, b) => b.score - a.score)
        .map((player, index) => (
          <div
            key={player.userId}
            className={`score-row ${player.userId === myUserId ? "me" : ""}`}
          >
            <span className="score-rank">#{index + 1}</span>
            <span className="score-player">
              <span className="score-name">{player.username}</span>
              {answerTarget === "separate" && progressByUserId[player.userId] && (
                <span className="answer-progress-tags">
                  {progressByUserId[player.userId].titleFound && <span>Titre</span>}
                  {progressByUserId[player.userId].artistFound && <span>Artiste</span>}
                </span>
              )}
            </span>
            {player.streak >= 2 && <span className="streak-badge">x{player.streak}</span>}
            <span className="score-pts">{player.score}</span>
          </div>
        ))}

      {history.length > 0 && (
        <section className="track-history">
          <h3>Deja joues</h3>
          {history.map((track) => (
            <div className="history-track" key={track.roundNumber}>
              {track.coverUrl ? (
                <img src={track.coverUrl} alt="" />
              ) : (
                <span className="history-cover">♪</span>
              )}
              <div>
                <strong>{track.title}</strong>
                <span>{track.artist}</span>
                <TrackLinks title={track.title} artist={track.artist} compact />
              </div>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}
