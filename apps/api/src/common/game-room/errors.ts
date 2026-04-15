/**
 * Extracts a string error code from an unknown thrown value.
 * Works whether the service throws `new Error('ROOM_NOT_FOUND')` or a plain string.
 */
export function extractErrorCode(e: unknown): string {
  return e instanceof Error ? e.message : 'UNKNOWN_ERROR';
}
