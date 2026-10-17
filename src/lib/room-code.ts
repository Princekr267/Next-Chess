/**
 * Generate a short, human-friendly room code.
 * Format: 6 uppercase alphanumeric chars (no ambiguous chars like 0/O, 1/I/L).
 * ~1.5 billion possible codes — collision-safe for a small-scale app.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 30 chars, no 0/O/1/I/L

export function generateRoomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
