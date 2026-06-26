import { useEffect, useState } from "react";

export function usePersistedNumber(key: string, fallback: number, min = -Infinity, max = Infinity) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallback;
    const stored = Number(window.localStorage.getItem(key));
    return Number.isFinite(stored) && stored >= min && stored <= max ? stored : fallback;
  });

  useEffect(() => {
    window.localStorage.setItem(key, String(value));
  }, [key, value]);

  return [value, setValue] as const;
}
