import { Form, Link } from "@adonisjs/inertia/react";

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
              <div className="form-group">
                <label htmlFor="fullName">Nom complet</label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  autoComplete="name"
                  placeholder="Jean Dupont"
                  data-invalid={errors.fullName ? true : undefined}
                />
                {errors.fullName && <div className="field-error">{errors.fullName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  placeholder="toi@exemple.com"
                  data-invalid={errors.email ? true : undefined}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  data-invalid={errors.password ? true : undefined}
                />
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="passwordConfirmation">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="passwordConfirmation"
                  id="passwordConfirmation"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  data-invalid={errors.passwordConfirmation ? true : undefined}
                />
                {errors.passwordConfirmation && (
                  <div className="field-error">{errors.passwordConfirmation}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: "0.5rem" }}
              >
                Créer mon compte
              </button>
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
