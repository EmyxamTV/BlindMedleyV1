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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
          {isCurrentUser && <p className="profile-bio">{profileUser.email}</p>}
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
            <Form route="profile.update" encType="multipart/form-data">
              {({ errors }) => (
                <>
                  <div className="form-group">
                    <label htmlFor="profile-username">Pseudo</label>
                    <input
                      id="profile-username"
                      type="text"
                      name="username"
                      defaultValue={profile?.username ?? ""}
                      data-invalid={errors.username ? true : undefined}
                    />
                    {errors.username && <div className="field-error">{errors.username}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-full-name">Nom affiché / nom complet</label>
                    <input
                      id="profile-full-name"
                      type="text"
                      name="fullName"
                      defaultValue={profileUser.fullName ?? ""}
                      data-invalid={errors.fullName ? true : undefined}
                    />
                    {errors.fullName && <div className="field-error">{errors.fullName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-email">Adresse email</label>
                    <input
                      id="profile-email"
                      type="email"
                      name="email"
                      defaultValue={profileUser.email ?? ""}
                      data-invalid={errors.email ? true : undefined}
                    />
                    {errors.email && <div className="field-error">{errors.email}</div>}
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Si tu changes l’email, renseigne ton mot de passe actuel.
                    </p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-current-password">Mot de passe actuel</label>
                    <input
                      id="profile-current-password"
                      type="password"
                      name="currentPassword"
                      autoComplete="current-password"
                      placeholder="Requis uniquement pour changer l’email"
                    />
                    {errors.currentPassword && (
                      <div className="field-error">{errors.currentPassword}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-bio">Bio</label>
                    <textarea id="profile-bio" name="bio" defaultValue={profile?.bio ?? ""} rows={3} />
                    {errors.bio && <div className="field-error">{errors.bio}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-country">Pays (code ISO, ex : FR)</label>
                    <input
                      id="profile-country"
                      type="text"
                      name="country"
                      defaultValue={profile?.country ?? ""}
                      maxLength={2}
                      placeholder="FR"
                    />
                    {errors.country && <div className="field-error">{errors.country}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-avatar">Image de profil</label>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-violet-500/20">
                        {(avatarPreview || profile?.avatarUrl) ? (
                          <img
                            src={avatarPreview ?? profile?.avatarUrl ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center font-black text-white">
                            {profileUser.initials}
                          </span>
                        )}
                      </div>
                      <input
                        id="profile-avatar"
                        type="file"
                        name="avatar"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          setAvatarPreview(file ? URL.createObjectURL(file) : null);
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      name="avatarUrl"
                      defaultValue={profile?.avatarUrl ?? ""}
                      placeholder="Ou colle une URL d’image"
                    />
                    {errors.avatarUrl && <div className="field-error">{errors.avatarUrl}</div>}
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className={buttonClassName()}>
                      Sauvegarder le profil
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

            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Mot de passe
              </h3>
              <Form action="/profile/password" method="post">
                {({ errors }) => (
                  <>
                    <div className="form-group">
                      <label htmlFor="password-current">Mot de passe actuel</label>
                      <input
                        id="password-current"
                        type="password"
                        name="currentPassword"
                        autoComplete="current-password"
                      />
                      {errors.currentPassword && (
                        <div className="field-error">{errors.currentPassword}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="password-new">Nouveau mot de passe</label>
                      <input
                        id="password-new"
                        type="password"
                        name="password"
                        autoComplete="new-password"
                      />
                      {errors.password && <div className="field-error">{errors.password}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="password-confirmation">Confirmer le nouveau mot de passe</label>
                      <input
                        id="password-confirmation"
                        type="password"
                        name="passwordConfirmation"
                        autoComplete="new-password"
                      />
                      {errors.passwordConfirmation && (
                        <div className="field-error">{errors.passwordConfirmation}</div>
                      )}
                    </div>
                    <button type="submit" className={buttonClassName({ variant: "ghost" })}>
                      Changer le mot de passe
                    </button>
                  </>
                )}
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
