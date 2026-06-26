import { useEffect, useRef, useState, type CSSProperties } from "react";

export function AudioPlayer({
  previewUrl,
  volume,
  onVolumeChange,
}: {
  previewUrl: string;
  volume: number;
  onVolumeChange: (value: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setBlocked(false);
    setPlaying(false);
    audio.volume = volume / 100;
    audio.play().catch(() => setBlocked(true));
  }, [previewUrl, volume]);

  function updateVolume(value: number) {
    onVolumeChange(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  }

  const handleCardClick = () => {
    const audio = audioRef.current;
    if (!audio || playing) return;
    audio.play().catch(() => {});
  };

  return (
    <div
      className={`audio-card ${blocked ? "needs-click" : ""}`}
      onClick={handleCardClick}
      style={{ cursor: blocked ? "pointer" : "default" }}
    >
      <audio
        ref={audioRef}
        src={previewUrl}
        autoPlay
        onPlay={() => {
          setPlaying(true);
          setBlocked(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className={`audio-wave ${playing ? "" : "paused"}`}>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <label className="volume-control" onClick={(event) => event.stopPropagation()}>
        <span aria-hidden="true">Volume</span>
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => updateVolume(Number(event.target.value))}
          style={{ "--volume": `${volume}%` } as CSSProperties}
        />
        <span className="volume-value">{volume}%</span>
      </label>
      {blocked && (
        <p style={{ margin: "8px 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
          Appuie ici pour lancer l'audio
        </p>
      )}
    </div>
  );
}
