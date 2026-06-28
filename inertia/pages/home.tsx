import { Link } from "@adonisjs/inertia/react";
import { buttonClassName } from "~/components/ui/button";
import type { InertiaProps } from "~/types";

export default function Home({ user }: InertiaProps) {
  return (
    <div className="mx-auto max-w-[1100px] px-6">
      <section className="hero">
        <div className="hero-badge">🎵 Blind Test Musical</div>
        <h1 className="hero-title">
          Devinez les morceaux, <span className="hero-accent">dominez le classement</span>
        </h1>
        <p className="hero-desc">
          Jouez en solo ou défiez vos amis en temps réel. Des milliers de titres Spotify, des rounds
          chronométrés, un seul objectif : être le meilleur.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link route="playlists.index" className={buttonClassName({ size: "lg" })}>
              Jouer maintenant
            </Link>
          ) : (
            <>
              <Link route="new_account.create" className={buttonClassName({ size: "lg" })}>
                Commencer gratuitement
              </Link>
              <Link
                route="session.create"
                className={buttonClassName({ variant: "ghost", size: "lg" })}
              >
                Se connecter
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🎵</div>
          <h3>Solo</h3>
          <p>Entraîne-toi à ton rythme avec des playlists par genre, décennie ou difficulté.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Multijoueur</h3>
          <p>Affronte jusqu'à 8 joueurs en temps réel. Lobbies publics ou codes privés.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏆</div>
          <h3>Classements</h3>
          <p>Grimpe dans les charts global, hebdomadaire, mensuel ou entre amis.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Progression</h3>
          <p>Gagne de l'XP, monte de niveau, débloque des badges et perfectionne ta précision.</p>
        </div>
      </section>

      <section className="how-it-works">
        <h2>Comment ça marche</h2>
        <p>Simple, rapide, addictif.</p>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <strong>Choisis une playlist</strong>
              <p>Pop, rock, rap, années 80... des centaines de playlists Spotify.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <strong>Écoute l'extrait</strong>
              <p>30 secondes pour identifier le titre. Plus tu réponds vite, plus tu scores.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <strong>Monte le classement</strong>
              <p>Enchaîne les bonnes réponses pour activer le mode combo ×2.5.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-8 text-sm text-slate-500 sm:flex-row">
        <p>All rights reserved 2026 Blindmedley</p>
        <Link route="privacy_policy" className="font-semibold text-violet-300 hover:text-white">
          Politique de confidentialité
        </Link>
      </footer>
    </div>
  );
}
