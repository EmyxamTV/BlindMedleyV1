let gameAudioContext: AudioContext | null = null;

export function getGameAudioContext() {
  if (!gameAudioContext) gameAudioContext = new AudioContext();
  return gameAudioContext;
}

/** À appeler directement pendant le clic qui précède l’entrée dans une partie. */
export async function unlockAudio() {
  const context = getGameAudioContext();
  try {
    await Promise.race([
      context.resume(),
      new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
    ]);
    if (context.state !== "running") return;
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.start();
  } catch {
    // Le lecteur affichera son bouton de secours si le navigateur refuse encore.
  }
}
