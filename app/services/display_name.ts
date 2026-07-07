export function displayUsername(value: string | null | undefined, fallback = "Joueur") {
  const name = value?.trim();
  if (!name) return fallback;
  return name;
}

export function usernameFromName(value: string | null | undefined, fallback = "Joueur") {
  const firstName = value?.trim().split(/\s+/)[0] ?? "";
  const username = firstName.replace(/[^\p{Letter}\p{Number}_-]/gu, "");
  return username || fallback;
}

export function displayUsernameForUser({
  username,
  fullName,
  fallback = "Joueur",
}: {
  username: string | null | undefined;
  fullName: string | null | undefined;
  fallback?: string;
}) {
  const storedUsername = username?.trim();
  const nameUsername = usernameFromName(fullName, "");

  if (
    storedUsername &&
    nameUsername &&
    storedUsername.toLocaleLowerCase("fr-FR") === nameUsername.toLocaleLowerCase("fr-FR")
  ) {
    return nameUsername;
  }

  return storedUsername || fullName?.trim() || fallback;
}
