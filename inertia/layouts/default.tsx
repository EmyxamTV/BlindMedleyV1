import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()
  const props = children.props

  useEffect(() => {
    toast.dismiss()
  }, [url])

  if (props.flash?.error) toast.error(props.flash.error)
  if (props.flash?.success) toast.success(props.flash.success)

  const user = props.user
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link route="home" className="navbar-logo">
            <svg width="110" height="20" viewBox="0 0 195 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M180 37.5v-30h-7.5V0H195v7.5h-7.5v30H180ZM150 15V7.5h-15V0h15v7.5h7.5V15H150Zm-15 22.5V30h-7.5V7.5h7.5V30h15v7.5h-15Zm15-7.5v-7.5h7.5V30H150ZM82.5 37.5v-30H90V0h15v7.5h7.5v30H105v-15H90v15h-7.5ZM90 15h15V7.8H90V15ZM45 37.5V0h22.5v7.5h-15V15h15v7.5h-15V30h15v7.5H45ZM0 37.5V0h22.5v7.5H30V15h-7.5v15H30v7.5h-7.5V30H15v-7.5H7.5v15H0ZM7.5 15h14.7V7.5H7.5V15Z" fill="url(#logo-grad)" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="195" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
          </Link>

          {user && (
            <nav className="navbar-nav">
              <Link route="game.index" className="nav-link">Jouer</Link>
              <Link route="leaderboard.index" className="nav-link">Classement</Link>
              <Link route="profile.show" className="nav-link">Profil</Link>
            </nav>
          )}

          <div className="navbar-right">
            {user ? (
              <>
                {isAdmin && (
                  <Link route="admin.dashboard" className="admin-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Admin
                  </Link>
                )}
                <Link route="profile.show" className="user-pill">
                  <span className="user-avatar">{user.initials}</span>
                  <span className="user-name">{user.initials}</span>
                </Link>
                <Form route="session.destroy">
                  <button type="submit" className="logout-btn" title="Se déconnecter">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                  </button>
                </Form>
              </>
            ) : (
              <div className="auth-links">
                <Link route="session.create" className="nav-link">Connexion</Link>
                <Link route="new_account.create" className="btn-signup">S'inscrire</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <Toaster position="top-center" richColors theme="dark" />
    </>
  )
}
