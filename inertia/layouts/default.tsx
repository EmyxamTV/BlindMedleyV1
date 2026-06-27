import { Data } from "@generated/data";
import { toast, Toaster } from "sonner";
import { usePage } from "@inertiajs/react";
import { ReactElement, useEffect } from "react";
import { Form, Link } from "@adonisjs/inertia/react";

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage();
  const props = children.props;

  useEffect(() => {
    toast.dismiss();
  }, [url]);

  if (props.flash?.error) toast.error(props.flash.error);
  if (props.flash?.success) toast.success(props.flash.success);

  const user = props.user;
  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const displayName = (user as any)?.fullName?.split(" ")[0] || user?.initials || "??";

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link route="home" className="navbar-logo">
            <span className="navbar-logo-text">BLINDMEDLEY</span>
          </Link>

          {user && (
            <nav className="navbar-nav">
              <Link route="game.index" className="nav-link">
                Jouer
              </Link>
              <Link route="practice.index" className="nav-link">
                Entraînement
              </Link>
              <Link route="bandle.index" className="nav-link">
                Progressif
              </Link>
              <Link route="leaderboard.index" className="nav-link">
                Classement
              </Link>
              <Link route="playlists.index" className="nav-link">
                Playlists
              </Link>
              <Link route="profile.show" className="nav-link">
                Profil
              </Link>
            </nav>
          )}

          <div className="navbar-right">
            {user ? (
              <>
                {isAdmin && (
                  <Link route="admin.dashboard" className="admin-btn">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Admin
                  </Link>
                )}
                <Link route="profile.show" className="user-pill">
                  <span className="user-avatar">{user.initials}</span>
                  <span className="user-name">{displayName}</span>
                </Link>
                <Form route="session.destroy">
                  <button type="submit" className="logout-btn" title="Se déconnecter">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                  </button>
                </Form>
              </>
            ) : (
              <div className="auth-links">
                <Link route="session.create" className="nav-link">
                  Connexion
                </Link>
                <Link route="new_account.create" className="btn-signup">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      {/* Navigation mobile */}
      {user && (
        <nav className="mobile-nav">
          <Link route="game.index" className="mobile-nav-link">
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
            Jouer
          </Link>
          <Link route="practice.index" className="mobile-nav-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
            Solo
          </Link>
          <Link route="leaderboard.index" className="mobile-nav-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Classement
          </Link>
          <Link route="profile.show" className="mobile-nav-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil
          </Link>
        </nav>
      )}

      <Toaster position="top-center" richColors theme="dark" />
    </>
  );
}
