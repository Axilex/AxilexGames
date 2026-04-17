/**
 * Normalises a user-submitted word for comparison:
 * - lowercased
 * - trimmed
 * - diacritics stripped (NFD decomposition)
 * - non-latin letters removed
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}
