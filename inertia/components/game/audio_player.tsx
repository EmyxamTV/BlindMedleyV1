import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export function AudioPlayer({
  previewUrl,
  volume,
  onVolumeChange,
  autoPlay = true,
  playKey,
  maxPlayMs,
  onPlayError,
  disabled = false,
}: {
  previewUrl: string;
  volume: number;
  onVolumeChange: (value: number) => void;
  autoPlay?: boolean;
  playKey?: number;
  maxPlayMs?: number;
  onPlayError?: () => void;
  disabled?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopTimer = useRef<number | null>(null);
  const disabledRef = useRef(disabled);
  const maxPlayMsRef = useRef(maxPlayMs);
  const onPlayErrorRef = useRef(onPlayError);
  const volumeRef = useRef(volume);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const clearStopTimer = useCallback(() => {
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  }, []);

  const play = useCallback((fromStart = false) => {
    const audio = audioRef.current;
    if (!audio || disabledRef.current) return;
    clearStopTimer();
    if (fromStart) audio.currentTime = 0;
    audio.play().catch(() => {
      setBlocked(true);
      onPlayErrorRef.current?.();
    });
    if (maxPlayMsRef.current) {
      stopTimer.current = window.setTimeout(() => audio.pause(), maxPlayMsRef.current);
    }
  }, [clearStopTimer]);

  useEffect(() => {
    disabledRef.current = disabled;
    maxPlayMsRef.current = maxPlayMs;
    onPlayErrorRef.current = onPlayError;
    volumeRef.current = volume;
  }, [disabled, maxPlayMs, onPlayError, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearStopTimer();
    setBlocked(false);
    setPlaying(false);
    audio.volume = volumeRef.current / 100;
    if (disabled) {
      audio.pause();
      return clearStopTimer;
    }
    if (autoPlay && !disabled) play();
    return clearStopTimer;
  }, [previewUrl, autoPlay, disabled, play, clearStopTimer]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (playKey) play(true);
  }, [playKey, play]);

  function updateVolume(value: number) {
    onVolumeChange(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  }

  return (
    <div className={`audio-card ${blocked ? "needs-click" : ""}`}>
      <audio
        ref={audioRef}
        src={previewUrl}
        autoPlay={autoPlay}
        onPlay={() => {
          setPlaying(true);
          setBlocked(false);
        }}
        onPause={() => {
          clearStopTimer();
          setPlaying(false);
        }}
        onEnded={() => {
          clearStopTimer();
          setPlaying(false);
        }}
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
      <label className="volume-control">
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
        <button
          type="button"
          onClick={() => play(Boolean(maxPlayMs))}
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
            margin: "8px 0 0",
            opacity: 0.7,
          }}
        >
          Appuie ici pour lancer l'audio
        </button>
      )}
    </div>
  );
}
