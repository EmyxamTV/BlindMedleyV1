import { Link } from "@adonisjs/inertia/react";
import { buttonClassName } from "~/components/ui/button";
import type { InertiaProps } from "~/types";

const features = [
  {
    icon: "🎵",
    title: "Solo",
    text: "Entraîne-toi à ton rythme avec des playlists par genre, décennie ou difficulté.",
  },
  {
    icon: "⚡",
    title: "Multijoueur",
    text: "Affronte jusqu’à 8 joueurs en temps réel. Lobbies publics ou codes privés.",
  },
  {
    icon: "🏆",
    title: "Classements",
    text: "Grimpe dans les charts global, hebdomadaire, mensuel ou entre amis.",
  },
  {
    icon: "🎯",
    title: "Progression",
    text: "Gagne de l’XP, monte de niveau, débloque des badges et perfectionne ta précision.",
  },
];

const steps = [
  {
    step: 1,
    title: "Choisis une playlist",
    text: "Pop, rock, rap, années 80... des centaines de playlists Spotify.",
  },
  {
    step: 2,
    title: "Écoute l’extrait",
    text: "30 secondes pour identifier le titre. Plus tu réponds vite, plus tu scores.",
  },
  {
    step: 3,
    title: "Monte le classement",
    text: "Enchaîne les bonnes réponses pour gagner un bonus de série progressif.",
  },
];

export default function Home({ user }: InertiaProps) {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20">
      <section className="relative py-20 text-center sm:py-28 before:pointer-events-none before:absolute before:left-1/2 before:top-0 before:h-[380px] before:w-[700px] before:-translate-x-1/2 before:bg-[radial-gradient(ellipse,rgba(124,58,237,0.22)_0%,rgba(236,72,153,0.08)_50%,transparent_70%)] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-full after:-translate-x-1/2 after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent">
        <div className="relative inline-flex animate-[fadeSlideDown_0.6s_ease_both] items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-4 py-1.5 text-[0.78rem] font-semibold tracking-[0.3px] text-violet-300">
          🎵 Blind Test Musical
        </div>

        <h1 className="relative mx-auto mt-7 max-w-4xl animate-[fadeSlideUp_0.7s_0.1s_ease_both] text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[1.06] tracking-[-1.5px] text-white">
          Devinez les morceaux,{" "}
          <span className="bg-linear-135 from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            dominez le classement
          </span>
        </h1>

        <p className="relative mx-auto mt-6 max-w-[540px] animate-[fadeSlideUp_0.7s_0.2s_ease_both] text-[1.1rem] leading-8 text-slate-400">
          Jouez en solo ou défiez vos amis en temps réel. Des milliers de titres Spotify, des rounds
          chronométrés, un seul objectif : être le meilleur.
        </p>

        <div className="relative mt-12 flex flex-wrap justify-center gap-3">
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

      <section className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f0f1a] px-6 py-7 transition duration-200 before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-linear-135 before:from-[#7c3aed] before:to-[#ec4899] before:transition-transform before:duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:before:scale-x-100"
          >
            <div className="mb-4 text-3xl">{feature.icon}</div>
            <h3 className="mb-2 text-base font-bold text-white">{feature.title}</h3>
            <p className="text-sm leading-7 text-slate-400">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 pb-4">
        <h2 className="mb-2 text-center text-3xl font-extrabold tracking-[-0.5px] text-white">
          Comment ça marche
        </h2>
        <p className="mb-10 text-center text-sm text-slate-400">Simple, rapide, addictif.</p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-[#0f0f1a] p-6 transition hover:border-violet-500/25"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-135 from-[#7c3aed] to-[#ec4899] text-sm font-extrabold text-white">
                {item.step}
              </span>
              <div>
                <strong className="mb-1 block text-sm font-bold text-white">{item.title}</strong>
                <p className="text-[0.82rem] leading-6 text-slate-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-8 text-sm text-slate-500 sm:flex-row">
        <p>All rights reserved 2026 Blindmedley</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link route="cgu" className="font-semibold text-violet-300 hover:text-white">
            CGU
          </Link>
          <Link route="privacy_policy" className="font-semibold text-violet-300 hover:text-white">
            Politique de confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
