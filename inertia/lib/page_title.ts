type PageProps = Record<string, any>;

export function pageTitle(component: string, props: PageProps) {
  switch (component) {
    case "home":
      return "Accueil";
    case "privacy_policy":
      return "Politique de confidentialité";
    case "auth/login":
      return "Connexion";
    case "auth/signup":
      return "Inscription";
    case "admin/dashboard":
      return "Dashboard";
    case "admin/playlists":
      return "Playlists";
    case "admin/users":
      return "Utilisateurs";
    case "playlists/index":
      return "Playlists";
    case "playlists/create":
      return "Créer une playlist";
    case "playlists/edit":
      return props.playlist?.name ?? "Playlist";
    case "game/index":
      return "Jouer";
    case "game/wizard":
      return props.playlist?.name ?? "Configurer la partie";
    case "game/lobby":
    case "game/play":
      return props.game?.playlistName ?? "Partie";
    case "game/results":
      return props.game?.playlistName ? `Résultats - ${props.game.playlistName}` : "Résultats";
    case "practice":
      return "Entraînement";
    case "bandle":
      return "Progressif";
    case "leaderboard":
      return "Classement";
    case "profile":
      return props.profileUser?.profile?.username ?? props.profileUser?.fullName ?? "Profil";
    case "errors/not_found":
      return "Page introuvable";
    case "errors/server_error":
      return "Erreur serveur";
    default:
      return undefined;
  }
}
