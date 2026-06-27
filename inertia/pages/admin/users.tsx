import { useState } from "react";
import { Link, Form } from "@adonisjs/inertia/react";
import { router } from "@inertiajs/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { InertiaProps } from "~/types";
import type { JSONDataTypes } from "@adonisjs/core/types/transformers";

interface AdminUser extends Record<string, JSONDataTypes> {
  id: number;
  email: string;
  fullName: string | null;
  username: string | undefined;
  role: string;
  status: string;
  createdAt: string;
}

interface Meta extends Record<string, JSONDataTypes> {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

interface Props extends InertiaProps {
  users: AdminUser[];
  meta: Meta;
  search: string;
  statusFilter: string;
}

const STATUS_LABELS: Record<string, string> = {
  "": "Tous",
  active: "Actif",
  suspended: "Suspendu",
  banned: "Banni",
};

function UserAvatar({ name }: { name: string }) {
  return <div className="admin-avatar">{name[0]?.toUpperCase() ?? "?"}</div>;
}

export default function AdminUsers({ users, meta, search, statusFilter }: Props) {
  const [q, setQ] = useState(search);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.get("/admin/users", { search: q, status: statusFilter });
  }

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div>
          <h1>Utilisateurs</h1>
          <p className="admin-sub">{meta.total} comptes enregistrés</p>
        </div>
        <nav className="admin-nav">
          <Link route="admin.dashboard" className="admin-nav-link">
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
          <Link route="admin.users" className="admin-nav-link active">
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

      <form className="search-row" onSubmit={handleSearch}>
        <Input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par email ou pseudo..."
        />
        <Button type="submit">
          Rechercher
        </Button>
      </form>

      <div className="filter-row">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${statusFilter === key ? "active" : ""}`}
            onClick={() => router.get("/admin/users", { search, status: key })}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: "center", color: "var(--text-3)", padding: "2rem" }}
                >
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={u.status === "banned" ? "row-banned" : ""}>
                  <td>
                    <div className="user-cell">
                      <UserAvatar name={u.username ?? u.fullName ?? "?"} />
                      <div>
                        <span className="user-cell-name">{u.username ?? u.fullName ?? "—"}</span>
                        <span className="user-cell-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${u.status}`}>
                      {STATUS_LABELS[u.status] ?? u.status}
                    </span>
                  </td>
                  <td className="td-date">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <div className="table-actions">
                      {u.status === "active" && (
                        <>
                          <Form route="admin.suspend" routeParams={{ id: u.id }}>
                            {() => (
                              <button type="submit" className="btn-sm btn-warn">
                                Suspendre 24h
                              </button>
                            )}
                          </Form>
                          <Form route="admin.ban" routeParams={{ id: u.id }}>
                            {() => (
                              <button type="submit" className="btn-sm btn-danger">
                                Bannir
                              </button>
                            )}
                          </Form>
                        </>
                      )}
                      {u.status !== "active" && (
                        <Form route="admin.unban" routeParams={{ id: u.id }}>
                          {() => (
                            <button type="submit" className="btn-sm btn-success">
                              Débannir
                            </button>
                          )}
                        </Form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        {meta.currentPage > 1 && (
          <button
            className="btn btn-ghost"
            onClick={() =>
              router.get("/admin/users", {
                search,
                status: statusFilter,
                page: meta.currentPage - 1,
              })
            }
          >
            ← Précédent
          </button>
        )}
        <span className="pager-info">
          Page {meta.currentPage} / {meta.lastPage} — {meta.total} utilisateurs
        </span>
        {meta.currentPage < meta.lastPage && (
          <button
            className="btn btn-ghost"
            onClick={() =>
              router.get("/admin/users", {
                search,
                status: statusFilter,
                page: meta.currentPage + 1,
              })
            }
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}
