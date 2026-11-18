// No look-alike characters (0/o, 1/l/i) so passwords can be read off paper.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Random password, works in the browser and on the server (Web Crypto). */
export function randomPassword(length = 8): string {
  const bytes = new Uint32Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt limit used by Supabase Auth
