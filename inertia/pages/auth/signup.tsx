import { Form, Link } from "@adonisjs/inertia/react";
import { Button } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export default function Signup() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
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

        <h1>Créer un compte</h1>
        <p className="auth-subtitle">
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

              <Button type="submit" full style={{ marginTop: "0.5rem" }}>
                Créer mon compte
              </Button>
            </>
          )}
        </Form>

        <p className="auth-footer">
          Déjà un compte ? <Link route="session.create">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
