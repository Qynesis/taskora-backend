/**
 * Convert any numeric-ish value to a dollar amount rounded to 2 decimal places.
 * Prevents floating-point drift (e.g. 10.879999999 → 10.88).
 */
export function money(value: number | string | null | undefined): number {
  return parseFloat(Number(value ?? 0).toFixed(2));
}

/**
 * Convert a dollar amount to cents (integer), safe for Stripe API calls.
 */
export function toCents(dollars: number | string | null | undefined): number {
  return Math.round(money(dollars) * 100);
}
