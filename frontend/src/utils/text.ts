/**
 * Normalizes text for case-insensitive and accent-insensitive matching.
 * Converts to lowercase, decomposes diacritics via Unicode NFD,
 * removes combining marks, and trims whitespace.
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks whether the source text contains the search query as a partial substring,
 * ignoring case and accents/diacritics.
 */
export function matchesPartialText(source?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true;
  if (!source) return false;
  return normalizeText(source).includes(normalizeText(query));
}
