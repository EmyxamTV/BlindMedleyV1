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
            <button
              className={buttonClassName({ variant: "ghost", size: "sm" })}
              onClick={() => setEditOpen(true)}
            >
              Modifier
            </button>
          </div>
        )}
      </div>

      {profile && (
        <div className="stats-grid">
          <StatCard label="Parties" value={profile.totalGames} />
          <StatCard label="Victoires" value={profile.totalWins} />
          <StatCard label="Précision" value={`${accuracy}%`} />
          <StatCard label="Score moyen" value={Math.round(profile.avgScore)} />
          <StatCard label="Meilleure série" value={profile.bestStreak} />
        </div>
      )}

      {(profileUser.achievements ?? []).length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <h2>Badges obtenus</h2>
          </div>
          <div className="achievements-grid">
            {(profileUser.achievements ?? []).map((achievement) => (
              <div
                key={achievement.id}
                className="achievement"
                title={achievement.description ?? achievement.name}
              >
                <span className="achievement-icon">{achievement.icon ?? "🏅"}</span>
                <span className="achievement-name">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-section">
        <div className="section-header">
          <h2>Historique des parties</h2>
        </div>
        {recentGames.length === 0 ? (
          <p className="empty-state">Aucune partie jouée pour l’instant.</p>
        ) : (
          <div className="history-list">
            {recentGames.map((game) => (
              <div key={game.id} className="history-item">
                <div className="history-left">
                  <span className={`mode-badge mode-${game.mode}`}>{game.mode}</span>
                  <span className="history-name">{game.playlistName}</span>
                </div>
                <div className="history-right">
                  {game.rank && <span className="h-rank">#{game.rank}</span>}
                  <span className="h-score">{game.score} pts</span>
                  <span className="h-acc">
                    {game.correct}/{game.correct + game.incorrect}
                  </span>
                  <span className="h-xp">+{game.xpEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCurrentUser && (
        <dialog
          open={editOpen}
          className={`modal ${editOpen ? "open" : ""}`}
          aria-modal="true"
          aria-labelledby="profile-edit-title"
          onCancel={(event) => {
            event.preventDefault();
            setEditOpen(false);
          }}
        >
          <div className="modal-box max-h-[88vh] !max-w-5xl overflow-y-auto !p-0">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#11111d]/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">
                  Compte joueur
                </p>
                <h2 id="profile-edit-title" className="!mb-0 mt-1 text-2xl font-black text-white">
                  Modifier le profil
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm font-black text-slate-400 transition hover:bg-white/5 hover:text-white"
                onClick={() => setEditOpen(false)}
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <Form route="profile.update" encType="multipart/form-data">
                {({ errors }) => (
                  <div className="grid gap-6">
                    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                        Identité
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                          <label htmlFor="profile-full-name">Nom affiché</label>
                          <input
                            id="profile-full-name"
                            type="text"
                            name="fullName"
                            defaultValue={profileUser.fullName ?? ""}
                            data-invalid={errors.fullName ? true : undefined}
                          />
                          {errors.fullName && <div className="field-error">{errors.fullName}</div>}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_120px]">
                        <div className="form-group">
                          <label htmlFor="profile-bio">Bio</label>
                          <textarea
                            id="profile-bio"
                            name="bio"
                            defaultValue={profile?.bio ?? ""}
                            rows={4}
                            placeholder="Une petite phrase pour ton profil..."
                          />
                          {errors.bio && <div className="field-error">{errors.bio}</div>}
                        </div>
                        <div className="form-group">
                          <label htmlFor="profile-country">Pays</label>
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
                      </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                        Connexion
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                        </div>
                        <div className="form-group">
                          <label htmlFor="profile-current-password">Mot de passe actuel</label>
                          <input
                            id="profile-current-password"
                            type="password"
                            name="currentPassword"
                            autoComplete="current-password"
                            placeholder="Seulement si l’email change"
                          />
                          {errors.currentPassword && (
                            <div className="field-error">{errors.currentPassword}</div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">
                        Le mot de passe actuel est uniquement requis si tu modifies ton email.
                      </p>
                    </section>

                    <div className="flex flex-wrap gap-3">
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
                  </div>
                )}
              </Form>

              <aside className="grid content-start gap-5">
                <Form route="profile.update" encType="multipart/form-data">
                  {({ errors }) => (
                    <section className="rounded-3xl border border-violet-300/20 bg-violet-500/10 p-5">
                      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-violet-200">
                        Image de profil
                      </h3>
                      <div className="mb-5 flex items-center gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-violet-500/20 shadow-xl shadow-violet-950/30">
                          {avatarPreview || profile?.avatarUrl ? (
                            <img
                              src={avatarPreview ?? profile?.avatarUrl ?? ""}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-2xl font-black text-white">
                              {profileUser.initials}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">
                            {profile?.username ?? "Joueur"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            PNG, JPG, WebP ou GIF. 3 Mo max.
                          </p>
                        </div>
                      </div>

                      <label
                        htmlFor="profile-avatar"
                        className="mb-3 block cursor-pointer rounded-2xl border border-dashed border-violet-300/30 bg-black/20 px-4 py-4 text-center text-sm font-black text-violet-100 transition hover:border-violet-200/60 hover:bg-violet-500/10"
                      >
                        Choisir une image
                      </label>
                      <input
                        id="profile-avatar"
                        className="sr-only"
                        type="file"
                        name="avatar"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          setAvatarPreview(file ? URL.createObjectURL(file) : null);
                        }}
                      />

                      <input
                        type="url"
                        name="avatarUrl"
                        defaultValue={profile?.avatarUrl ?? ""}
                        placeholder="Ou colle une URL d’image"
                      />
                      {errors.avatarUrl && <div className="field-error">{errors.avatarUrl}</div>}

                      <button type="submit" className={buttonClassName({ className: "mt-4 w-full" })}>
                        Enregistrer l’image
                      </button>
                    </section>
                  )}
                </Form>

                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                    Mot de passe
                  </h3>
                  <Form action="/profile/password" method="post">
                    {({ errors }) => (
                      <div className="grid gap-3">
                        <div className="form-group">
                          <label htmlFor="password-current">Actuel</label>
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
                          <label htmlFor="password-new">Nouveau</label>
                          <input
                            id="password-new"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                          />
                          {errors.password && <div className="field-error">{errors.password}</div>}
                        </div>
                        <div className="form-group">
                          <label htmlFor="password-confirmation">Confirmation</label>
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
                        <button
                          type="submit"
                          className={buttonClassName({ variant: "ghost", className: "w-full" })}
                        >
                          Changer le mot de passe
                        </button>
                      </div>
                    )}
                  </Form>
                </section>
              </aside>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
