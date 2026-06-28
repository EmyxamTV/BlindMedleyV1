import { usePersistedNumber } from "~/hooks/use_persisted_number";

const AUDIO_VOLUME_STORAGE_KEY = "blindmedley-audio-volume";

export function useAudioVolume() {
  return usePersistedNumber(AUDIO_VOLUME_STORAGE_KEY, 75, 0, 100);
}
