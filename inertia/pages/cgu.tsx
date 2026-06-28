const sections = [
  {
    title: "1. Objet du service",
    paragraphs: [
      "BlindMedley est une plateforme de jeu musical permettant de participer à des blind tests, de jouer seul ou en multijoueur, de créer ou rejoindre des parties, d’utiliser des playlists musicales, de consulter des classements, d’ajouter des amis et d’interagir avec d’autres joueurs.",
      "Le service est proposé à des fins de divertissement.",
    ],
  },
  {
    title: "2. Accès au service",
    paragraphs: [
      "L’accès à BlindMedley peut nécessiter la création d’un compte utilisateur.",
      "Vous vous engagez à fournir des informations exactes lors de votre inscription et à maintenir vos informations à jour.",
      "Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est réputée avoir été réalisée par vous, sauf preuve contraire.",
    ],
  },
  {
    title: "3. Utilisation autorisée",
    paragraphs: [
      "Vous vous engagez à utiliser BlindMedley de manière loyale, respectueuse et conforme aux lois applicables.",
      "Il est interdit de tricher, d’automatiser des réponses, d’exploiter une faille du jeu, de perturber le service, d’usurper l’identité d’un autre utilisateur, de publier des contenus abusifs ou illégaux, de tenter d’accéder à des données sans autorisation ou d’utiliser BlindMedley à des fins commerciales sans autorisation écrite préalable.",
      "En cas de comportement abusif, BlindMedley se réserve le droit de suspendre ou supprimer un compte, de limiter l’accès au service ou d’annuler des scores.",
    ],
  },
  {
    title: "4. Compte utilisateur",
    paragraphs: [
      "Chaque utilisateur est responsable de son compte et de son comportement sur la plateforme.",
      "BlindMedley peut supprimer ou suspendre un compte en cas de violation des présentes CGU, d’activité frauduleuse, de triche ou de comportement portant atteinte aux autres utilisateurs ou au service.",
      "Vous pouvez demander la suppression de votre compte selon les moyens mis à disposition par BlindMedley.",
    ],
  },
  {
    title: "5. Classements, scores et progression",
    paragraphs: [
      "Les scores, classements, statistiques, niveaux, badges ou éléments de progression sont fournis dans le cadre du jeu.",
      "BlindMedley peut corriger, réinitialiser ou supprimer des scores en cas d’erreur technique, de triche, d’abus ou de dysfonctionnement.",
      "Aucun score, badge, niveau ou classement ne donne droit à une récompense financière, sauf mention contraire explicite.",
    ],
  },
  {
    title: "6. Playlists et contenus musicaux",
    paragraphs: [
      "BlindMedley peut utiliser des extraits musicaux, métadonnées, pochettes, titres, noms d’artistes ou liens provenant de services tiers.",
      "Les contenus musicaux restent la propriété de leurs ayants droit respectifs. BlindMedley ne revendique aucun droit de propriété sur les musiques, artistes, albums, pochettes ou marques de services tiers.",
      "Certains extraits ou liens peuvent être indisponibles, modifiés ou supprimés par les services tiers. BlindMedley ne garantit pas la disponibilité permanente des contenus musicaux.",
    ],
  },
  {
    title: "7. Services tiers et absence d’affiliation",
    paragraphs: [
      "BlindMedley peut proposer des fonctionnalités liées à des services tiers, tels que Spotify, Deezer, YouTube, Apple Music ou d’autres plateformes musicales.",
      "L’utilisation de ces services peut être soumise à leurs propres conditions d’utilisation et politiques de confidentialité. BlindMedley n’est pas responsable du fonctionnement, du contenu ou des décisions prises par ces services tiers.",
      "BlindMedley n’est pas affilié, associé, sponsorisé, approuvé ni officiellement lié à Spotify, Deezer, YouTube, Apple Music ou à leurs sociétés propriétaires. Les noms, marques, logos et contenus associés à ces services appartiennent à leurs propriétaires respectifs.",
    ],
  },
  {
    title: "8. Données personnelles",
    paragraphs: [
      "BlindMedley peut collecter et traiter certaines données nécessaires au fonctionnement du service, comme les informations de compte, les scores, l’historique de parties, les relations d’amis ou les préférences de jeu.",
      "Ces données sont utilisées pour fournir le service, améliorer l’expérience utilisateur, assurer la sécurité de la plateforme et gérer les fonctionnalités du jeu.",
      "Vous disposez, selon la réglementation applicable, de droits d’accès, de rectification, d’opposition, de limitation et de suppression concernant vos données personnelles.",
    ],
  },
  {
    title: "9. Disponibilité du service",
    paragraphs: [
      "BlindMedley s’efforce de maintenir le service accessible et fonctionnel, mais ne garantit pas une disponibilité permanente ou sans interruption.",
      "Le service peut être temporairement indisponible en raison d’une maintenance, d’une mise à jour, d’un incident technique, d’une surcharge, d’un problème réseau ou d’une dépendance à un service tiers.",
    ],
  },
  {
    title: "10. Responsabilité",
    paragraphs: [
      "BlindMedley est fourni « en l’état ».",
      "BlindMedley ne peut être tenu responsable des dommages indirects, pertes de données, pertes de scores, interruptions de service, erreurs de classement, indisponibilités d’extraits musicaux ou problèmes causés par des services tiers.",
      "L’utilisateur est responsable de son utilisation du service et des conséquences de ses actions.",
    ],
  },
  {
    title: "11. Propriété intellectuelle",
    paragraphs: [
      "L’interface, le nom, les éléments graphiques, le code, les textes et les fonctionnalités propres à BlindMedley sont protégés par les droits de propriété intellectuelle applicables, sauf mention contraire.",
      "Toute reproduction, modification, diffusion ou exploitation non autorisée des éléments propres à BlindMedley est interdite.",
      "Les marques, logos, musiques, pochettes, noms d’artistes et contenus associés aux services tiers appartiennent à leurs propriétaires respectifs.",
    ],
  },
  {
    title: "12. Signalement",
    paragraphs: [
      "Vous pouvez signaler un comportement abusif, une triche, un contenu problématique ou un dysfonctionnement via les moyens de contact ou de signalement proposés par BlindMedley.",
      "BlindMedley se réserve le droit d’examiner les signalements et de prendre les mesures nécessaires.",
    ],
  },
  {
    title: "13. Modification des CGU",
    paragraphs: [
      "BlindMedley peut modifier les présentes CGU à tout moment afin de les adapter à l’évolution du service, de la loi ou des fonctionnalités proposées.",
      "En cas de modification importante, les utilisateurs pourront être informés par un moyen approprié.",
      "La poursuite de l’utilisation du service après modification vaut acceptation des nouvelles CGU.",
    ],
  },
  {
    title: "14. Loi applicable",
    paragraphs: [
      "Les présentes CGU sont soumises au droit français, sauf disposition légale impérative contraire.",
      "En cas de litige, les parties chercheront d’abord une solution amiable avant toute action judiciaire.",
    ],
  },
];

export default function Cgu() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 text-slate-100 sm:py-16">
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">CGU</p>
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">
          Conditions générales d’utilisation
        </h1>
        <p className="text-sm leading-7 text-slate-400">
          Dernière mise à jour : 28 juin 2026. Cette page définit les règles d’accès et
          d’utilisation du service BlindMedley.
        </p>
        <p className="text-sm leading-7 text-slate-400">
          En utilisant BlindMedley, vous acceptez ces conditions. Si vous n’êtes pas d’accord avec
          tout ou partie de ces règles, vous devez cesser d’utiliser le service.
        </p>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-3 text-base font-bold text-white">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-violet-300/20 bg-violet-400/10 p-5">
        <h2 className="mb-2 text-base font-bold text-white">Contact</h2>
        <p className="text-sm leading-7 text-slate-300">
          Pour toute question concernant ces CGU, vous pouvez contacter l’équipe BlindMedley par les
          moyens de contact mis à disposition sur le service.
        </p>
      </section>
    </div>
  );
}
