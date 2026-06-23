/**
 * Transmit defaults to crypto.randomUUID(), unavailable in older browsers and
 * non-secure (HTTP) local contexts. A stable-enough client id is sufficient
 * for an SSE subscription and keeps the realtime lobby functional everywhere.
 */
export function createRealtimeUid(): string {
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
