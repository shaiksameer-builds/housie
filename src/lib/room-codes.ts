/**
 * Room code generator.
 * Generates 6-character alphanumeric codes using characters
 * that are not easily confused (excludes O, 0, I, 1, L).
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[idx];
  }
  return code;
}

/**
 * Validates a room code format.
 */
export function isValidRoomCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  if (code.length !== 6) return false;
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}
