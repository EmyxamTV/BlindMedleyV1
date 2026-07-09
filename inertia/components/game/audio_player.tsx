import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const audioSourceCache = new Map<string, string>();
const audioSourceLoads = new Map<string, Promise<string>>();

function cachedAudioSource(previewUrl: string): Promise<string> {
  if (previewUrl.startsWith("blob:") || previewUrl.startsWith("data:")) {
    return Promise.resolve(previewUrl);
  }

  const cached = audioSourceCache.get(previewUrl);
  if (cached) return Promise.resolve(cached);

  const pending = audioSourceLoads.get(previewUrl);
  if (pending) return pending;

  const load = fetch(previewUrl, { headers: { Accept: "audio/*" } })
    .then((response) => {
      if (!response.ok) throw new Error("AUDIO_PREVIEW_UNAVAILABLE");
      return response.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      audioSourceCache.set(previewUrl, objectUrl);
      audioSourceLoads.delete(previewUrl);
      return objectUrl;
    })
    .catch((error) => {
      audioSourceLoads.delete(previewUrl);
      throw error;
    });

  audioSourceLoads.set(previewUrl, load);
  return load;
}

export function AudioPlayer({
  previewUrl,
  volume,
  onVolumeChange,
  autoPlay = true,
  playKey,
  maxPlayMs,
  startAtMs = 0,
  scheduledStartAt,
  scheduledEndAt,
  serverNow,
  onPlayError,
  disabled = false,
}: {
  previewUrl: string;
  volume: number;
  onVolumeChange: (value: number) => void;
  autoPlay?: boolean;
  playKey?: number;
  maxPlayMs?: number;
  startAtMs?: number;
  scheduledStartAt?: number;
  scheduledEndAt?: number;
  serverNow?: number;
  onPlayError?: () => void;
  disabled?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopTimer = useRef<number | null>(null);
  const startTimer = useRef<number | null>(null);
  const disabledRef = useRef(disabled);
  const maxPlayMsRef = useRef(maxPlayMs);
  const startAtMsRef = useRef(startAtMs);
  const serverClockOffsetRef = useRef(0);
  const scheduledStartAtRef = useRef(scheduledStartAt);
  const scheduledEndAtRef = useRef(scheduledEndAt);
  const onPlayErrorRef = useRef(onPlayError);
  const volumeRef = useRef(volume);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const clearStopTimer = useCallback(() => {
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  }, []);

  const clearStartTimer = useCallback(() => {
    if (startTimer.current !== null) window.clearTimeout(startTimer.current);
    startTimer.current = null;
  }, []);

  const currentServerNow = useCallback(() => Date.now() + serverClockOffsetRef.current, []);

  const scheduledOffsetMs = useCallback(() => {
    if (!scheduledStartAtRef.current) return startAtMsRef.current;
    return Math.max(startAtMsRef.current, currentServerNow() - scheduledStartAtRef.current);
  }, [currentServerNow]);

  const scheduleStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearStopTimer();

    if (scheduledEndAtRef.current) {
      const remainingMs = Math.max(0, scheduledEndAtRef.current - currentServerNow());
      stopTimer.current = window.setTimeout(() => audio.pause(), remainingMs);
      return;
    }

    if (maxPlayMsRef.current) {
      stopTimer.current = window.setTimeout(() => audio.pause(), maxPlayMsRef.current);
    }
  }, [clearStopTimer, currentServerNow]);

  const play = useCallback((fromStart = false) => {
    const audio = audioRef.current;
    if (!audio || disabledRef.current || !audio.src) return;
    clearStopTimer();
    if (fromStart || scheduledStartAtRef.current) {
      const startSeconds = scheduledOffsetMs() / 1000;
      audio.currentTime =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? Math.min(Math.max(0, startSeconds), Math.max(0, audio.duration - 0.2))
          : Math.max(0, startSeconds);
    }
    audio.play().catch(() => {
      setBlocked(true);
      onPlayErrorRef.current?.();
    });
    scheduleStop();
  }, [clearStopTimer, scheduleStop, scheduledOffsetMs]);

  useEffect(() => {
    disabledRef.current = disabled;
    maxPlayMsRef.current = maxPlayMs;
    startAtMsRef.current = startAtMs;
    scheduledStartAtRef.current = scheduledStartAt;
    scheduledEndAtRef.current = scheduledEndAt;
    onPlayErrorRef.current = onPlayError;
    volumeRef.current = volume;
  }, [disabled, maxPlayMs, onPlayError, scheduledEndAt, scheduledStartAt, startAtMs, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    let cancelled = false;
    serverClockOffsetRef.current = serverNow ? serverNow - Date.now() : 0;
    setAudioSrc(null);
    clearStartTimer();
    clearStopTimer();
    setBlocked(false);
    setPlaying(false);
    audio?.pause();

    cachedAudioSource(previewUrl)
      .then((source) => {
        if (!cancelled) setAudioSrc(source);
      })
      .catch(() => {
        if (!cancelled) setAudioSrc(previewUrl);
      });

    return () => {
      cancelled = true;
      clearStartTimer();
      clearStopTimer();
    };
  }, [previewUrl, clearStartTimer, clearStopTimer, serverNow]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;
    clearStartTimer();
    audio.volume = volumeRef.current / 100;
    if (disabled) {
      audio.pause();
      return () => {
        clearStartTimer();
        clearStopTimer();
      };
    }
    if (autoPlay && !disabled) {
      const delayMs = scheduledStartAt
        ? Math.max(0, scheduledStartAt - (Date.now() + serverClockOffsetRef.current))
        : 0;
      if (delayMs > 0) {
        startTimer.current = window.setTimeout(() => play(true), delayMs);
      } else {
        play(Boolean(scheduledStartAt));
      }
    }
    return () => {
      clearStartTimer();
      clearStopTimer();
    };
  }, [
    audioSrc,
    autoPlay,
    clearStartTimer,
    clearStopTimer,
    disabled,
    play,
    scheduledEndAt,
    scheduledStartAt,
  ]);

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
        src={audioSrc ?? undefined}
        preload="auto"
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
      >
        <track kind="captions" />
      </audio>
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
          className="mt-2 border-0 bg-transparent font-[inherit] text-inherit opacity-70"
        >
          Appuie ici pour lancer l’audio
        </button>
      )}
    </div>
  );
}
