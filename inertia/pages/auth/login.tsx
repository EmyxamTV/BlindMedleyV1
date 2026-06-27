import { Form, Link } from "@adonisjs/inertia/react";
import { Button } from "~/components/ui/button";
import { Field, FieldError, Label } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export default function Login() {
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
            <circle cx="12" cy="12" r="10" stroke="url(#auth-grad)" strokeWidth="2" />
            <path d="M9 8l6 4-6 4V8z" fill="url(#auth-grad)" />
            <defs>
              <linearGradient
                id="auth-grad"
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

        <h1>Bon retour !</h1>
        <p className="auth-subtitle">Connecte-toi pour reprendre la partie.</p>

        <Form route="session.store">
          {({ errors }) => (
            <>
              <Field>
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="username"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-invalid={errors.password ? true : undefined}
                />
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </Field>

              <Button type="submit" full style={{ marginTop: "0.5rem" }}>
                Se connecter
              </Button>
            </>
          )}
        </Form>

        <p className="auth-footer">
          Pas encore de compte ? <Link route="new_account.create">S'inscrire gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
