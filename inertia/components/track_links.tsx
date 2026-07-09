export function TrackLinks({
  title,
  artist,
  compact = false,
}: {
  title: string;
  artist: string;
  compact?: boolean;
}) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const linkClass = compact
    ? "inline-grid h-[22px] w-[22px] place-items-center rounded-full border border-violet-300/20 bg-violet-500/10 text-violet-200 transition hover:border-violet-200/50 hover:bg-violet-500/20 hover:text-white"
    : "inline-flex items-center rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-200 transition hover:border-violet-200/50 hover:bg-violet-500/20 hover:text-white";
  const iconClass = "h-3.5 w-3.5 fill-none stroke-current stroke-[2.3]";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "justify-center" : ""}`}>
      <a
        href={`https://open.spotify.com/search/${query}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Ouvrir sur Spotify"
        title="Spotify"
        className={linkClass}
      >
        {compact ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
            <path d="M5 8.5c4.8-1.4 9.6-.9 13.5 1.1M5.8 12c4.2-1.1 8.5-.6 12 1.1M6.7 15.3c3.4-.8 6.8-.4 9.5.9" />
          </svg>
        ) : (
          "Spotify"
        )}
      </a>
      <a
        href={`https://www.deezer.com/search/${query}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Ouvrir sur Deezer"
        title="Deezer"
        className={linkClass}
      >
        {compact ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            <path d="M3 17h3v-5H3zm4 0h3V8H7zm4 0h3v-9h-3zm4 0h3v-6h-3zm4 0h2v-3h-2z" />
          </svg>
        ) : (
          "Deezer"
        )}
      </a>
      <a
        href={`https://www.youtube.com/results?search_query=${query}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Ouvrir sur YouTube"
        title="YouTube"
        className={linkClass}
      >
        {compact ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2]">
            <path d="M21 12s0-4.1-.5-5.3c-.3-.7-.9-1.3-1.6-1.6C17.7 4.6 12 4.6 12 4.6s-5.7 0-6.9.5c-.7.3-1.3.9-1.6 1.6C3 7.9 3 12 3 12s0 4.1.5 5.3c.3.7.9 1.3 1.6 1.6 1.2.5 6.9.5 6.9.5s5.7 0 6.9-.5c.7-.3 1.3-.9 1.6-1.6.5-1.2.5-5.3.5-5.3Z" />
            <path d="m10 9 5 3-5 3Z" />
          </svg>
        ) : (
          "YouTube"
        )}
      </a>
    </div>
  );
}
