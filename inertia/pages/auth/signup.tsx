import { Form, Link } from "@adonisjs/inertia/react";
import { Button } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export default function Signup() {
  return (
    <div className="relative flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center px-4 py-8 before:pointer-events-none before:absolute before:left-1/2 before:top-[10%] before:h-[300px] before:w-[500px] before:-translate-x-1/2 before:bg-[radial-gradient(ellipse,rgba(124,58,237,0.13)_0%,transparent_70%)]">
      <div className="relative z-[1] w-full max-w-[420px] rounded-[22px] border border-white/10 bg-[#0f0f1a] px-9 py-10 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/25 bg-linear-135 from-violet-500/20 to-fuchsia-500/10">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="url(#auth-grad2)" strokeWidth="2" />
            <path d="M9 8l6 4-6 4V8z" fill="url(#auth-grad2)" />
            <defs>
              <linearGradient
                id="auth-grad2"
                x1="0"
                y1="0"
                x2="24"
                y2="24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="mb-1 text-2xl font-extrabold tracking-[-0.3px] text-white">
          Créer un compte
        </h1>
        <p className="mb-8 text-sm leading-6 text-slate-400">
          Rejoins des milliers de joueurs et grimpe dans le classement.
        </p>

        <Form route="new_account.store">
          {({ errors }) => (
            <>
              <Field>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  type="text"
                  name="fullName"
                  id="fullName"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  data-invalid={errors.fullName ? true : undefined}
                />
                {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
              </Field>

              <Field>
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  placeholder="toi@exemple.com"
                  data-invalid={errors.email ? true : undefined}
                />
                {errors.email && <FieldError>{errors.email}</FieldError>}
              </Field>

              <Field>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  data-invalid={errors.password ? true : undefined}
                />
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </Field>

              <Field>
                <Label htmlFor="passwordConfirmation">Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  name="passwordConfirmation"
                  id="passwordConfirmation"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  data-invalid={errors.passwordConfirmation ? true : undefined}
                />
                {errors.passwordConfirmation && (
                  <FieldError>{errors.passwordConfirmation}</FieldError>
                )}
              </Field>

              <Button type="submit" full className="mt-2">
                Créer mon compte
              </Button>
            </>
          )}
        </Form>

        <p className="mt-6 text-center text-[0.84rem] text-slate-600">
          Déjà un compte ?{" "}
          <Link route="session.create" className="font-semibold text-violet-300 hover:text-white">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
