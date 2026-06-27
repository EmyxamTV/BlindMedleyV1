import { useState } from "react";
import { Form } from "@adonisjs/inertia/react";
import { buttonClassName } from "~/components/ui/button";
import type { GamePlayerData, InertiaProps, UserData } from "~/types";

interface Props extends InertiaProps {
  profileUser: UserData;
  isCurrentUser: boolean;
  recentGames: GamePlayerData[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span className="stat-val">{value}</span>
      <span className="stat-lbl">{label}</span>
    </div>
  );
}

export default function Profile({ profileUser, isCurrentUser, recentGames }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const profile = profileUser.profile;
  const accuracy =
    profile && profile.totalAnswers > 0
      ? Math.round((profile.totalCorrect / profile.totalAnswers) * 100)
      : 0;
  const xpPercent = profile
    ? Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100))
    : 0;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-hero">
        <div className="profile-avatar">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" />
          ) : (
            <span>{profileUser.initials}</span>
          )}
        </div>

        <div className="profile-info">
          <h1>{profile?.username ?? profileUser.fullName ?? "Joueur"}</h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-tags">
            <span className="level-tag">Niv. {profile?.level ?? 1}</span>
            {profile?.country && <span className="country-tag">{profile.country}</span>}
          </div>

          {profile && (
            <div className="xp-row">
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <span className="xp-label">
                {profile.xp} / {profile.xpToNextLevel} XP
              </span>
            </div>
          )}
        </div>

        {isCurrentUser && (
          <div className="profile-edit-btn">
            <button className={buttonClassName({ variant: "ghost", size: "sm" })} onClick={() => setEditOpen(true)}>
              Modifier
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {profile && (
        <div className="stats-grid">
          <StatCard label="Parties" value={profile.totalGames} />
          <StatCard label="Victoires" value={profile.totalWins} />
          <StatCard label="Précision" value={`${accuracy}%`} />
          <StatCard label="Score moyen" value={Math.round(profile.avgScore)} />
          <StatCard label="Meilleure série" value={profile.bestStreak} />
        </div>
      )}

      {/* Achievements */}
      {(profileUser.achievements ?? []).length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Badges obtenus</h2>
          </div>
          <div className="achievements-grid">
            {(profileUser.achievements ?? []).map((a) => (
              <div key={a.id} className="achievement" title={a.description ?? a.name}>
                <span className="achievement-icon">{a.icon ?? "🏅"}</span>
                <span className="achievement-name">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Historique des parties</h2>
        </div>
        {recentGames.length === 0 ? (
          <p className="empty-state">Aucune partie jouée pour l'instant.</p>
        ) : (
          <div className="history-list">
            {recentGames.map((g) => (
              <div key={g.id} className="history-item">
                <div className="history-left">
                  <span className={`mode-badge mode-${g.mode}`}>{g.mode}</span>
                  <span className="history-name">{g.playlistName}</span>
                </div>
                <div className="history-right">
                  {g.rank && <span className="h-rank">#{g.rank}</span>}
                  <span className="h-score">{g.score} pts</span>
                  <span className="h-acc">
                    {g.correct}/{g.correct + g.incorrect}
                  </span>
                  <span className="h-xp">+{g.xpEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {isCurrentUser && (
        <div
          className={`modal ${editOpen ? "open" : ""}`}
          onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}
        >
          <div className="modal-box">
            <h2>Modifier le profil</h2>
            <Form route="profile.update">
              {({ errors }) => (
                <>
                  <div className="form-group">
                    <label>Pseudo</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={profile?.username ?? ""}
                      data-invalid={errors.username ? true : undefined}
                    />
                    {errors.username && <div className="field-error">{errors.username}</div>}
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea name="bio" defaultValue={profile?.bio ?? ""} rows={3} />
                  </div>
                  <div className="form-group">
                    <label>Pays (code ISO, ex: FR)</label>
                    <input
                      type="text"
                      name="country"
                      defaultValue={profile?.country ?? ""}
                      maxLength={2}
                      placeholder="FR"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className={buttonClassName()}>
                      Sauvegarder
                    </button>
                    <button
                      type="button"
                      className={buttonClassName({ variant: "ghost" })}
                      onClick={() => setEditOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
