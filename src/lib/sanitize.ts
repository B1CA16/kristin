/**
 * Strip HTML tags from user-submitted text to prevent XSS.
 * Returns null if the result is empty after stripping.
 */
export function sanitizeText(input: string | undefined): string | null {
  if (!input) return null;
  const cleaned = input.replace(/<[^>]*>/g, '').trim();
  return cleaned || null;
}
