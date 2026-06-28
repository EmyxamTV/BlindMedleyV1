const sections = [
  {
    title: "Données collectées",
    body: "BlindMedley collecte les informations nécessaires à la création du compte, à la connexion, au profil joueur, aux parties, aux scores et à la gestion des playlists. Certaines données techniques peuvent aussi être enregistrées pour sécuriser le service et corriger les erreurs.",
  },
  {
    title: "Finalités",
    body: "Les données servent à fournir le jeu, gérer les comptes, afficher les classements, prévenir les abus, améliorer la stabilité du service et répondre aux obligations légales applicables en France.",
  },
  {
    title: "Base légale",
    body: "Le traitement repose principalement sur l'exécution du contrat d'utilisation, l'intérêt légitime de sécurisation et d'amélioration du service, le consentement lorsque celui-ci est requis, et le respect d'obligations légales.",
  },
  {
    title: "Durée de conservation",
    body: "Les données sont conservées pendant la durée nécessaire à l'utilisation du service. Un compte supprimé entraîne la suppression ou l'anonymisation des données associées, sauf obligation légale de conservation plus longue.",
  },
  {
    title: "Partage des données",
    body: "Les données ne sont pas vendues. Elles peuvent être transmises à des prestataires techniques strictement nécessaires au fonctionnement du service, notamment l'hébergement, l'authentification, les services musicaux connectés et la maintenance.",
  },
  {
    title: "Vos droits",
    body: "Conformément au RGPD et à la loi Informatique et Libertés, vous pouvez demander l'accès, la rectification, l'effacement, la limitation, l'opposition ou la portabilité de vos données. Vous pouvez aussi retirer un consentement à tout moment lorsqu'un traitement repose sur celui-ci.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 text-slate-100 sm:py-16">
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">RGPD</p>
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="text-sm leading-7 text-slate-400">
          Cette page résume simplement la manière dont BlindMedley traite les données personnelles,
          dans le cadre du Règlement général sur la protection des données et de la loi française
          Informatique et Libertés.
        </p>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-2 text-base font-bold text-white">{section.title}</h2>
            <p className="text-sm leading-7 text-slate-400">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-5">
        <h2 className="mb-2 text-base font-bold text-white">Contact et réclamation</h2>
        <p className="text-sm leading-7 text-slate-300">
          Pour exercer vos droits, contactez l'éditeur du site avec l'adresse email utilisée sur
          votre compte. En cas de difficulté, vous pouvez déposer une réclamation auprès de la CNIL.
        </p>
      </section>
    </div>
  );
}
