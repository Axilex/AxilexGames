/**
 * Throws `Error(code)` if `n` is not a finite number within `[min, max]`.
 * Used at service boundaries to reject malformed Socket.IO payloads — the
 * project ships TypeScript interfaces (no class-validator), so runtime checks
 * live in services rather than DTO decorators.
 */
export function assertBounds(
  n: unknown,
  min: number,
  max: number,
  code: string,
): asserts n is number {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
    throw new Error(code);
  }
}
