import crypto from "node:crypto";

const previewTokens = new Map<string, { trackId: string; expiresAt: number }>();
const TOKEN_TTL_MS = 10 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function prunePreviewTokens(): void {
  const now = Date.now();
  for (const [token, entry] of previewTokens.entries()) {
    if (entry.expiresAt < now) previewTokens.delete(token);
  }
}

export function createAudioPreviewToken(trackId: string): string {
  prunePreviewTokens();
  const token = generateToken();
  previewTokens.set(token, { trackId, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

export function resolveAudioPreviewToken(token: string): string | null {
  const entry = previewTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    previewTokens.delete(token);
    return null;
  }
  return entry.trackId;
}
