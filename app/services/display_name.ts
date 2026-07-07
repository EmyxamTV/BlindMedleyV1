export function displayUsername(value: string | null | undefined, fallback = "Joueur") {
  const name = value?.trim();
  if (!name) return fallback;

  return name
    .split(/([\s_-]+)/)
    .map((part) => {
      if (!part || /^[\s_-]+$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("fr-FR") + part.slice(1);
    })
    .join("");
}
