import { useState } from "react";
import { router } from "@inertiajs/react";
import { Form } from "@adonisjs/inertia/react";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface Entry extends Record<string, JSONDataTypes> {
  rank: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  level: number;
  score: number;
  country: string | null;
}

interface Props extends InertiaProps {
  period: "global" | "weekly" | "monthly";
  country: string | null;
  entries: Entry[];
  myRank: number | null;
  friendsLeaderboard: Entry[];
  search: string;
  searchResults: {
    userId: number;
    username: string;
    avatarUrl: string | null;
  }[];
  relationshipByUserId: Record<string, { id: number; status: string; incoming: boolean }>;
  incomingRequests: {
    id: number;
    requesterId: number;
    requester?: { username: string; avatarUrl: string | null };
  }[];
}

const PERIODS = [
  { key: "global", label: "Global" },
  { key: "weekly", label: "Cette semaine" },
  { key: "monthly", label: "Ce mois" },
] as const;

function EntryRow({ entry, isMe }: { entry: Entry; isMe: boolean }) {
  const isTop3 = entry.rank <= 3;
  const rankDisplay =
    entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;

  return (
    <div className={`lb-row ${isMe ? "me" : ""}`}>
      <span className={`lb-rank ${isTop3 ? "top" : ""}`}>{rankDisplay}</span>
      <div className="lb-player">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="lb-av" />
        ) : (
          <div className="lb-av-ph">{entry.username[0].toUpperCase()}</div>
        )}
        <div>
          <span className="lb-username">{entry.username}</span>
          {entry.country && <span className="lb-country">{entry.country}</span>}
        </div>
      </div>
      <span className="lb-level">Niv. {entry.level}</span>
      <span className="lb-score">{entry.score.toLocaleString()} pts</span>
    </div>
  );
}

export default function Leaderboard({
  period,
  country,
  entries,
  myRank,
  friendsLeaderboard,
  search,
  searchResults,
  relationshipByUserId,
  incomingRequests,
  user,
}: Props) {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [query, setQuery] = useState(search);

  function changePeriod(p: string) {
    router.get("/leaderboard", { period: p, country: country ?? undefined });
  }

  function searchFriends(event: React.FormEvent) {
    event.preventDefault();
    router.get(
      "/leaderboard",
      { period, country: country ?? undefined, search: query },
      { preserveState: true },
    );
  }

  const relationshipFor = (userId: number) => relationshipByUserId[String(userId)] ?? null;

  return (
    <div className="leaderboard-page">
      <div className="lb-topbar">
        <h1>Classement</h1>
        {myRank && (
          <div className="my-rank-chip">
            Votre rang : <strong>#{myRank}</strong>
          </div>
        )}
      </div>

      <div className="lb-controls">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "global" ? "active" : ""}`}
            onClick={() => setActiveTab("global")}
          >
            Général
          </button>
          <button
            className={`tab ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            Amis
          </button>
        </div>

        {activeTab === "global" && (
          <div className="periods">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`period-btn ${period === p.key ? "active" : ""}`}
                onClick={() => changePeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lb-list">
        {activeTab === "global" &&
          (entries.length === 0 ? (
            <p className="empty-state">Aucun score enregistré pour cette période.</p>
          ) : (
            entries.map((e) => <EntryRow key={e.userId} entry={e} isMe={e.userId === user?.id} />)
          ))}

        {activeTab === "friends" && (
          <>
            <section className="friends-panel">
              <h2>Ajouter des amis</h2>
              <form className="friend-search" onSubmit={searchFriends}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un pseudo"
                  minLength={2}
                />
                <button className="btn btn-primary btn-sm" type="submit">
                  Rechercher
                </button>
              </form>
              {searchResults.map((player) => (
                <div className="friend-result" key={player.userId}>
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="" />
                  ) : (
                    <span className="friend-avatar">{player.username[0].toUpperCase()}</span>
                  )}
                  <strong>{player.username}</strong>
                  {relationshipFor(player.userId)?.status === "accepted" ? (
                    <span className="friend-status">Ami</span>
                  ) : relationshipFor(player.userId)?.incoming ? (
                    <Form
                      route="friends.accept"
                      routeParams={{ id: relationshipFor(player.userId)!.id }}
                    >
                      <button className="btn btn-primary btn-sm">Accepter</button>
                    </Form>
                  ) : relationshipFor(player.userId) ? (
                    <span className="friend-status">Demande envoyée</span>
                  ) : (
                    <Form route="friends.request" routeParams={{ userId: player.userId }}>
                      <button className="btn btn-ghost btn-sm">Ajouter</button>
                    </Form>
                  )}
                </div>
              ))}
              {search.length >= 2 && searchResults.length === 0 && (
                <p className="empty-state">Aucun joueur trouvé.</p>
              )}
            </section>

            {incomingRequests.length > 0 && (
              <section className="friends-panel">
                <h2>Demandes reçues</h2>
                {incomingRequests.map((request) => (
                  <div className="friend-result" key={request.id}>
                    {request.requester?.avatarUrl ? (
                      <img src={request.requester.avatarUrl} alt="" />
                    ) : (
                      <span className="friend-avatar">
                        {(request.requester?.username ??
                          `Joueur ${request.requesterId}`)[0].toUpperCase()}
                      </span>
                    )}
                    <strong>
                      {request.requester?.username ?? `Joueur ${request.requesterId}`}
                    </strong>
                    <Form route="friends.accept" routeParams={{ id: request.id }}>
                      <button className="btn btn-primary btn-sm">Accepter</button>
                    </Form>
                    <Form route="friends.decline" routeParams={{ id: request.id }}>
                      <button className="btn btn-ghost btn-sm">Refuser</button>
                    </Form>
                  </div>
                ))}
              </section>
            )}

            {friendsLeaderboard.length === 0 ? (
              <p className="empty-state">Pas encore d'amis classés.</p>
            ) : (
              friendsLeaderboard.map((e) => (
                <EntryRow key={e.userId} entry={e} isMe={e.userId === user?.id} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
