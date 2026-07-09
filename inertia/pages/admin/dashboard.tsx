import { useState } from "react";
// oxlint-disable jsx-a11y/control-has-associated-label -- Faux positifs sur des cellules de tableau dans la liste des parties.
import { Form, Link } from "@adonisjs/inertia/react";
import { buttonClassName } from "~/components/ui/button";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface RecentGame extends Record<string, JSONDataTypes> {
  id: string;
  numericId: string;
  mode: string;
  status: string;
  source?: string | null;
  name?: string | null;
  publicId?: string | null;
  answerMode: string;
  answerTarget: string;
  difficulty: number;
  maxPlayers: number;
  roundCount: number;
  playlistName: string;
  hostUsername?: string | null;
  playerCount?: number;
  createdAt: string | null;
}

interface Props extends InertiaProps {
  stats: { totalUsers: number; totalGames: number; activePlaylists: number };
  recentGames: RecentGame[];
  allGames: RecentGame[];
  officialPlaylists: { id: string; name: string; trackCount: number }[];
}

const STAT_ICONS = {
  users: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  games: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  playlists: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
};

function statusLabel(s: string) {
  if (s === "waiting") return "En attente";
  if (s === "starting") return "Démarrage";
  if (s === "active") return "En cours";
  if (s === "paused") return "En pause";
  if (s === "finished") return "Terminée";
  return s;
}

function gameStatusLabel(status: string) {
  if (status === "waiting") return "En attente";
  if (status === "starting") return "Démarrage";
  if (status === "active") return "En cours";
  if (status === "paused") return "En pause";
  if (status === "finished") return "Terminée";
  if (status === "cancelled") return "Désactivée";
  return status;
}

function sourceLabel(source?: string | null) {
  return source === "blindmedley" ? "BlindMedley" : "Joueur";
}

function statusBadgeClass(status: string) {
  if (status === "waiting") return "border-sky-300/20 bg-sky-400/10 text-sky-200";
  if (status === "starting") return "border-violet-300/20 bg-violet-400/10 text-violet-200";
  if (status === "active") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  if (status === "paused") return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  if (status === "finished") return "border-slate-300/15 bg-slate-400/10 text-slate-300";
  if (status === "cancelled") return "border-red-300/20 bg-red-400/10 text-red-200";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function modeLabel(mode: string) {
  if (mode === "public") return "Public";
  if (mode === "private") return "Privé";
  if (mode === "solo") return "Solo";
  return mode;
}

export default function AdminDashboard({ stats, recentGames, allGames, officialPlaylists }: Props) {
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<RecentGame | null>(null);

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Administration</h1>
          <p className="admin-sub">Vue d'ensemble de la plateforme</p>
        </div>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link active">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link route="admin.users" className="admin-nav-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Utilisateurs
          </Link>
          <Link route="admin.playlists" className="admin-nav-link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
            </svg>
            Playlists
          </Link>
        </nav>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.users}</div>
          <span className="admin-stat-val">{stats.totalUsers}</span>
          <span className="admin-stat-lbl">Utilisateurs</span>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.games}</div>
          <span className="admin-stat-val">{stats.totalGames}</span>
          <span className="admin-stat-lbl">Parties jouées</span>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-icon">{STAT_ICONS.playlists}</div>
          <span className="admin-stat-val">{stats.activePlaylists}</span>
          <span className="admin-stat-lbl">Playlists actives</span>
        </div>
      </div>

      <section className="rounded-3xl border border-amber-300/20 bg-amber-500/10 p-5 text-slate-100 shadow-2xl shadow-black/20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Parties officielles
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Parties publiques BlindMedley
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-amber-100/70">
              Crée des parties officielles visibles même vides, avec XP, succès et classement actifs.
            </p>
          </div>
          <button
            type="button"
            className={buttonClassName({ className: "shrink-0" })}
            onClick={() => setOfficialModalOpen(true)}
            disabled={officialPlaylists.length === 0}
          >
            Créer une partie officielle
          </button>
        </div>

        {officialPlaylists.length === 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
            Aucune playlist active avec extrait jouable. Importe ou active une playlist avant de créer
            une partie officielle.
          </div>
        )}
      </section>

      <dialog
        className={`modal ${officialModalOpen ? "open" : ""}`}
        aria-labelledby="official-game-title"
        open={officialModalOpen}
        onCancel={() => setOfficialModalOpen(false)}
      >
        <div className="modal-box max-h-[90vh] !max-w-3xl overflow-y-auto">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Partie officielle
              </p>
              <h2 id="official-game-title" className="!mb-0 mt-2 text-2xl font-black text-white">
                Créer une partie BlindMedley
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Configure une partie publique officielle. Elle restera affichée même sans joueur.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-slate-400 transition hover:text-white"
              aria-label="Fermer la modale"
              onClick={() => setOfficialModalOpen(false)}
            >
              ×
            </button>
          </div>

          {officialPlaylists.length > 0 && (
          <Form route="admin.games.official.create">
            {({ errors, processing }) => (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                  Nom
                  <input
                    name="name"
                    placeholder="Ex : BlindMedley du soir"
                    className="rounded-xl border border-white/10 bg-[#11111d] px-4 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition placeholder:text-slate-600 focus:border-amber-200/60"
                  />
                  {errors.name && <span className="text-xs normal-case tracking-normal text-red-300">{errors.name}</span>}
                </label>

                <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                  Playlist
                  <select
                    name="playlistId"
                    defaultValue={officialPlaylists[0]?.id}
                    className="rounded-xl border border-white/10 bg-[#11111d] px-4 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-amber-200/60"
                  >
                    {officialPlaylists.map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name} · {playlist.trackCount} titres
                      </option>
                    ))}
                  </select>
                  {errors.playlistId && (
                    <span className="text-xs normal-case tracking-normal text-red-300">{errors.playlistId}</span>
                  )}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <AdminSelect
                    name="answerMode"
                    label="Réponse"
                    options={[
                      ["choices", "QCM"],
                      ["text", "Écrit"],
                    ]}
                  />
                  <AdminSelect
                    name="answerTarget"
                    label="Objectif"
                    options={[
                      ["both", "Titre + artiste"],
                      ["title", "Titre"],
                      ["artist", "Artiste"],
                      ["separate", "Points séparés"],
                    ]}
                  />
                  <AdminSelect
                    name="maxPlayers"
                    label="Joueurs"
                    options={[
                      ["2", "2 joueurs"],
                      ["4", "4 joueurs"],
                      ["6", "6 joueurs"],
                      ["8", "8 joueurs"],
                      ["10", "10 joueurs"],
                      ["12", "12 joueurs"],
                      ["16", "16 joueurs"],
                      ["20", "20 joueurs"],
                      ["30", "30 joueurs"],
                      ["50", "50 joueurs"],
                    ]}
                  />
                  <AdminSelect
                    name="roundCount"
                    label="Rounds"
                    options={[
                      ["5", "5 rounds"],
                      ["10", "10 rounds"],
                      ["15", "15 rounds"],
                      ["20", "20 rounds"],
                      ["30", "30 rounds"],
                    ]}
                  />
                  <AdminSelect
                    name="difficulty"
                    label="Difficulté"
                    options={[
                      ["1", "Facile"],
                      ["2", "Normal"],
                      ["3", "Difficile"],
                      ["4", "Expert"],
                      ["5", "Légendaire"],
                    ]}
                  />
                </div>

                <div className="modal-actions justify-end">
                  <button
                    type="button"
                    className={buttonClassName({ variant: "ghost" })}
                    onClick={() => setOfficialModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className={buttonClassName()} disabled={processing}>
                    Créer la partie
                  </button>
                </div>
              </div>
            )}
          </Form>
          )}
        </div>
      </dialog>

      <dialog
        className={`modal ${editingGame ? "open" : ""}`}
        aria-labelledby="edit-game-title"
        open={Boolean(editingGame)}
        onCancel={() => setEditingGame(null)}
      >
        {editingGame && (
          <div className="modal-box max-h-[90vh] !max-w-3xl overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                  Édition
                </p>
                <h2 id="edit-game-title" className="!mb-0 mt-2 text-2xl font-black text-white">
                  Modifier la partie
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Ajuste les réglages principaux. Les rounds sont régénérés seulement si la partie
                  n’a pas encore démarré.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-slate-400 transition hover:text-white"
                aria-label="Fermer la modale"
                onClick={() => setEditingGame(null)}
              >
                ×
              </button>
            </div>

            <Form route="admin.games.update" routeParams={{ id: editingGame.numericId }}>
              {({ errors, processing }) => (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
                    Nom
                    <input
                      name="name"
                      defaultValue={editingGame.name || editingGame.playlistName}
                      className="rounded-xl border border-white/10 bg-[#11111d] px-4 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition placeholder:text-slate-600 focus:border-violet-200/60"
                    />
                    {errors.name && (
                      <span className="text-xs normal-case tracking-normal text-red-300">
                        {errors.name}
                      </span>
                    )}
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                    Playlist : <span className="font-black text-white">{editingGame.playlistName}</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminSelect
                      name="answerMode"
                      label="Réponse"
                      defaultValue={editingGame.answerMode}
                      options={[
                        ["choices", "QCM"],
                        ["text", "Écrit"],
                      ]}
                    />
                    <AdminSelect
                      name="answerTarget"
                      label="Objectif"
                      defaultValue={editingGame.answerTarget}
                      options={[
                        ["both", "Titre + artiste"],
                        ["title", "Titre"],
                        ["artist", "Artiste"],
                        ["separate", "Points séparés"],
                      ]}
                    />
                    <AdminSelect
                      name="maxPlayers"
                      label="Joueurs"
                      defaultValue={String(editingGame.maxPlayers)}
                      options={[
                        ["2", "2 joueurs"],
                        ["4", "4 joueurs"],
                        ["6", "6 joueurs"],
                        ["8", "8 joueurs"],
                        ["10", "10 joueurs"],
                        ["12", "12 joueurs"],
                        ["16", "16 joueurs"],
                        ["20", "20 joueurs"],
                        ["30", "30 joueurs"],
                        ["50", "50 joueurs"],
                      ]}
                    />
                    <AdminSelect
                      name="roundCount"
                      label="Rounds"
                      defaultValue={String(editingGame.roundCount)}
                      options={[
                        ["5", "5 rounds"],
                        ["10", "10 rounds"],
                        ["15", "15 rounds"],
                        ["20", "20 rounds"],
                        ["30", "30 rounds"],
                      ]}
                    />
                    <AdminSelect
                      name="difficulty"
                      label="Difficulté"
                      defaultValue={String(editingGame.difficulty)}
                      options={[
                        ["1", "Facile"],
                        ["2", "Normal"],
                        ["3", "Difficile"],
                        ["4", "Expert"],
                        ["5", "Légendaire"],
                      ]}
                    />
                  </div>

                  <div className="modal-actions justify-end">
                    <button
                      type="button"
                      className={buttonClassName({ variant: "ghost" })}
                      onClick={() => setEditingGame(null)}
                    >
                      Annuler
                    </button>
                    <button type="submit" className={buttonClassName()} disabled={processing}>
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </Form>
          </div>
        )}
      </dialog>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-slate-100">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
              Parties
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Toutes les parties créées</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Désactive une partie pour la retirer des parties publiques et stopper son cycle.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-slate-300">
            {allGames.length} partie{allGames.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-[920px] divide-y divide-white/10 text-left text-sm">
            <thead className="bg-black/20 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="w-[270px] px-4 py-3">Partie</th>
                <th className="w-[150px] px-4 py-3">Type</th>
                <th className="w-[145px] px-4 py-3">Playlist</th>
                <th className="w-[80px] px-4 py-3 text-center">Joueurs</th>
                <th className="w-[120px] px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créée</th>
                <th className="w-[120px] px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#0f0f19]/70">
              {allGames.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center font-bold text-slate-500">
                    Aucune partie créée.
                  </td>
                </tr>
              ) : (
                allGames.map((game) => {
                  const canDisable = !["finished", "cancelled"].includes(game.status);
                  const canReactivate = game.status === "cancelled";

                  return (
                    <tr key={game.numericId} className="align-middle">
                      <td className="px-4 py-4">
                        <div className="max-w-[250px]">
                          <p className="truncate font-black text-white">
                            {game.name || game.playlistName || "Partie sans nom"}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                            #{game.publicId ?? game.id} · Hôte : {game.hostUsername ?? "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="whitespace-nowrap rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-xs font-black text-violet-200">
                            {modeLabel(game.mode)}
                          </span>
                          <span className="whitespace-nowrap rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-200">
                            {sourceLabel(game.source)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-300">
                        <span className="block max-w-[125px] truncate">{game.playlistName}</span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-white">{game.playerCount ?? 0}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex min-w-[96px] justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-black ${statusBadgeClass(
                            game.status,
                          )}`}
                        >
                          {gameStatusLabel(game.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-400">
                        {game.createdAt ? new Date(game.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-nowrap justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-violet-300/25 bg-violet-500/10 text-violet-200 transition hover:bg-violet-500/20"
                            title="Éditer"
                            aria-label="Éditer la partie"
                            onClick={() => setEditingGame(game)}
                            >
                              <span className="sr-only">Éditer</span>
                              <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                        {canDisable ? (
                          <Form route="admin.games.disable" routeParams={{ id: game.numericId }}>
                            {({ processing }) => (
                              <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/25 bg-amber-500/10 text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:hidden"
                                title="Désactiver"
                                aria-label="Désactiver la partie"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M8 12h8" />
                                </svg>
                                <span className="sr-only">Désactiver</span>
                              </button>
                            )}
                          </Form>
                        ) : (
                          <span className="hidden text-xs font-black uppercase tracking-wide text-slate-600">
                            —
                          </span>
                        )}
                          {canReactivate && (
                            <Form route="admin.games.reactivate" routeParams={{ id: game.numericId }}>
                              {({ processing }) => (
                                <button
                                  type="submit"
                                  disabled={processing}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-500/10 text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:sr-only"
                                  title="Réactiver"
                                  aria-label="Réactiver la partie"
                                  >
                                  <span className="sr-only">Réactiver</span>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M5 12a7 7 0 0 1 12-5" />
                                    <path d="M17 3v4h-4" />
                                    <path d="M19 12a7 7 0 0 1-12 5" />
                                    <path d="M7 21v-4h4" />
                                  </svg>
                                </button>
                              )}
                            </Form>
                          )}
                          <Form route="admin.games.delete" routeParams={{ id: game.numericId }}>
                            {({ processing }) => (
                              <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300/25 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Supprimer"
                                aria-label="Supprimer la partie"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v5" />
                                  <path d="M14 11v5" />
                                </svg>
                                <span className="sr-only">Supprimer</span>
                              </button>
                            )}
                          </Form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hidden">
        <h2>Parties récentes</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mode</th>
                <th>Playlist</th>
                <th>Statut</th>
                <th>Créée</th>
              </tr>
            </thead>
            <tbody>
              {recentGames.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500"
                  >
                    Aucune partie récente
                  </td>
                </tr>
              ) : (
                recentGames.map((g) => (
                  <tr key={g.numericId}>
                    <td>
                      <span className="admin-id">#{g.numericId}</span>
                    </td>
                    <td>
                      <span className={`mode-badge mode-${g.mode}`}>{g.mode}</span>
                    </td>
                    <td>{g.playlistName}</td>
                    <td>
                      <span className={`status-badge status-${g.status}`}>
                        {statusLabel(g.status)}
                      </span>
                    </td>
                    <td className="td-date">
                      {g.createdAt ? new Date(g.createdAt).toLocaleDateString("fr-FR") : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: [string, string][];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-400">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? options[0]?.[0]}
        className="rounded-xl border border-white/10 bg-[#11111d] px-4 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-amber-200/60"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
