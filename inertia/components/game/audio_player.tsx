import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getGameAudioContext } from "~/lib/audio_unlock";

const MAX_CACHED_SOURCES = 12;
const audioBufferCache = new Map<string, AudioBuffer>();
const audioBufferLoads = new Map<string, Promise<AudioBuffer>>();

function rememberAudioBuffer(previewUrl: string, buffer: AudioBuffer) {
  audioBufferCache.delete(previewUrl);
  audioBufferCache.set(previewUrl, buffer);
  while (audioBufferCache.size > MAX_CACHED_SOURCES) {
    const oldest = audioBufferCache.keys().next().value as string | undefined;
    if (!oldest) return;
    audioBufferCache.delete(oldest);
  }
}

function loadAudioBuffer(previewUrl: string): Promise<AudioBuffer> {
  const cached = audioBufferCache.get(previewUrl);
  if (cached) return Promise.resolve(cached);

  const pending = audioBufferLoads.get(previewUrl);
  if (pending) return pending;

  const load = fetch(previewUrl, { headers: { Accept: "audio/*" }, cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("AUDIO_PREVIEW_UNAVAILABLE");
      return response.arrayBuffer();
    })
    .then((data) => {
      if (data.byteLength === 0) throw new Error("AUDIO_PREVIEW_EMPTY");
      return getGameAudioContext().decodeAudioData(data);
    })
    .then((buffer) => {
      rememberAudioBuffer(previewUrl, buffer);
      audioBufferLoads.delete(previewUrl);
      return buffer;
    })
    .catch((error) => {
      audioBufferLoads.delete(previewUrl);
      throw error;
    });

  audioBufferLoads.set(previewUrl, load);
  return load;
}

/** Précharge et décode l’extrait suivant sans démarrer sa lecture. */
export function prefetchAudioSource(previewUrl: string | null | undefined): void {
  if (!previewUrl) return;
  void loadAudioBuffer(previewUrl).catch(() => undefined);
}

type ActivePlayback = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

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
  roundKey,
  shouldPlay = true,
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
  roundKey?: string;
  shouldPlay?: boolean;
}) {
  const playbackRef = useRef<ActivePlayback | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const visualStartTimerRef = useRef<number | null>(null);
  const visualEndTimerRef = useRef<number | null>(null);
  const serverClockOffsetRef = useRef(0);
  const scheduledStartAtRef = useRef(scheduledStartAt);
  const scheduledEndAtRef = useRef(scheduledEndAt);
  const startAtMsRef = useRef(startAtMs);
  const maxPlayMsRef = useRef(maxPlayMs);
  const disabledRef = useRef(disabled);
  const shouldPlayRef = useRef(shouldPlay);
  const autoPlayRef = useRef(autoPlay);
  const volumeRef = useRef(volume);
  const onPlayErrorRef = useRef(onPlayError);
  const loadGenerationRef = useRef(0);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const clearVisualTimers = useCallback(() => {
    if (visualStartTimerRef.current !== null) {
      window.clearTimeout(visualStartTimerRef.current);
      visualStartTimerRef.current = null;
    }
    if (visualEndTimerRef.current !== null) {
      window.clearTimeout(visualEndTimerRef.current);
      visualEndTimerRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    clearVisualTimers();
    const playback = playbackRef.current;
    playbackRef.current = null;
    if (playback) {
      playback.source.onended = null;
      try {
        playback.source.stop();
      } catch {
        // La source était déjà terminée.
      }
      playback.source.disconnect();
      playback.gain.disconnect();
    }
    setPlaying(false);
  }, [clearVisualTimers]);

  const currentServerNow = useCallback(() => Date.now() + serverClockOffsetRef.current, []);

  const startPlayback = useCallback(
    async (userInitiated = false) => {
      const audioBuffer = bufferRef.current;
      if (!audioBuffer) return;

      const now = currentServerNow();
      const startsAt = scheduledStartAtRef.current;
      const endsAt = scheduledEndAtRef.current;
      if (
        !autoPlayRef.current ||
        !shouldPlayRef.current ||
        disabledRef.current ||
        (endsAt !== undefined && now >= endsAt)
      ) {
        stopPlayback();
        return;
      }

      const context = getGameAudioContext();
      if (context.state !== "running") {
        if (!userInitiated) {
          setBlocked(true);
          stopPlayback();
          return;
        }
        try {
          await context.resume();
        } catch {
          setBlocked(true);
          onPlayErrorRef.current?.();
          return;
        }
      }

      const delayMs = startsAt ? Math.max(0, startsAt - now) : 0;
      const elapsedMs = startsAt ? Math.max(0, now - startsAt) : 0;
      const offsetSeconds = Math.max(0, (startAtMsRef.current + elapsedMs) / 1_000);
      if (offsetSeconds >= audioBuffer.duration) {
        stopPlayback();
        return;
      }

      let playDurationSeconds = audioBuffer.duration - offsetSeconds;
      if (endsAt !== undefined) {
        playDurationSeconds = Math.min(
          playDurationSeconds,
          Math.max(0, (endsAt - Math.max(now, startsAt ?? now)) / 1_000),
        );
      } else if (maxPlayMsRef.current !== undefined) {
        playDurationSeconds = Math.min(playDurationSeconds, maxPlayMsRef.current / 1_000);
      }
      if (playDurationSeconds <= 0) {
        stopPlayback();
        return;
      }

      stopPlayback();
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = audioBuffer;
      gain.gain.value = volumeRef.current / 100;
      source.connect(gain);
      gain.connect(context.destination);
      playbackRef.current = { source, gain };

      source.onended = () => {
        if (playbackRef.current?.source !== source) return;
        playbackRef.current = null;
        setPlaying(false);
      };

      const startWhen = context.currentTime + delayMs / 1_000;
      source.start(startWhen, offsetSeconds, playDurationSeconds);
      visualStartTimerRef.current = window.setTimeout(() => setPlaying(true), delayMs);
      visualEndTimerRef.current = window.setTimeout(
        () => setPlaying(false),
        delayMs + playDurationSeconds * 1_000,
      );
      setBlocked(false);
    },
    [currentServerNow, stopPlayback],
  );

  useEffect(() => {
    const previousOffset = serverClockOffsetRef.current;
    serverClockOffsetRef.current = serverNow === undefined ? 0 : serverNow - Date.now();
    if (
      bufferRef.current &&
      playbackRef.current &&
      Math.abs(previousOffset - serverClockOffsetRef.current) > 250
    ) {
      void startPlayback();
    }
  }, [serverNow, startPlayback]);

  useEffect(() => {
    scheduledStartAtRef.current = scheduledStartAt;
    scheduledEndAtRef.current = scheduledEndAt;
    startAtMsRef.current = startAtMs;
    maxPlayMsRef.current = maxPlayMs;
    disabledRef.current = disabled;
    shouldPlayRef.current = shouldPlay;
    autoPlayRef.current = autoPlay;
    volumeRef.current = volume;
    onPlayErrorRef.current = onPlayError;
  }, [
    autoPlay,
    disabled,
    maxPlayMs,
    onPlayError,
    scheduledEndAt,
    scheduledStartAt,
    shouldPlay,
    startAtMs,
    volume,
  ]);

  useEffect(() => {
    const generation = ++loadGenerationRef.current;
    let cancelled = false;
    stopPlayback();
    bufferRef.current = null;
    setBuffer(null);
    setBlocked(false);

    loadAudioBuffer(previewUrl)
      .then((loadedBuffer) => {
        if (cancelled || loadGenerationRef.current !== generation) return;
        bufferRef.current = loadedBuffer;
        setBuffer(loadedBuffer);
      })
      .catch(() => {
        if (cancelled || loadGenerationRef.current !== generation) return;
        setBlocked(true);
        onPlayErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      stopPlayback();
    };
  }, [previewUrl, roundKey, stopPlayback]);

  useEffect(() => {
    if (!buffer) return;
    void startPlayback();
  }, [autoPlay, buffer, disabled, scheduledEndAt, scheduledStartAt, shouldPlay, startPlayback]);

  useEffect(() => {
    volumeRef.current = volume;
    if (playbackRef.current) playbackRef.current.gain.gain.value = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (!playKey || !bufferRef.current) return;
    void startPlayback(true);
  }, [playKey, startPlayback]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden || !bufferRef.current) return;
      const context = getGameAudioContext();
      void context.resume().then(() => startPlayback());
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startPlayback]);

  useEffect(() => stopPlayback, [stopPlayback]);

  function updateVolume(value: number) {
    onVolumeChange(value);
    volumeRef.current = value;
    if (playbackRef.current) playbackRef.current.gain.gain.value = value / 100;
  }

  return (
    <div
      className={`audio-card ${blocked ? "needs-click" : ""}`}
      data-audio-state={blocked ? "blocked" : playing ? "playing" : "waiting"}
      data-audio-round={roundKey}
    >
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
          onClick={() => void startPlayback(true)}
          className="mt-2 border-0 bg-transparent font-[inherit] text-inherit opacity-70"
        >
          Appuie ici pour lancer l’audio
        </button>
      )}
    </div>
  );
}
