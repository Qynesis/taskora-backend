/** Convert a decimal amount (150.50) to Stripe cents (15050), rounding to avoid float errors. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert Stripe cents (15050) back to currency units (150.50). */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Return a new date `months` after the given date. */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/** Today's date at midnight UTC. */
export function getTodayUTC(): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

/**
 * Calculate total number of billing periods from payment frequency and duration.
 * WEEKLY = 4 periods/month, BI_WEEKLY/FORTNIGHTLY = 2, MONTHLY = 1.
 */
export function getNumberOfPeriods(frequency: string, durationMonths: number): number {
  switch (frequency) {
    case 'weekly': return durationMonths * 4;
    case 'bi_weekly':
    case 'fortnightly': return durationMonths * 2;
    case 'monthly':
    default: return durationMonths;
  }
}

/**
 * Convert a payment frequency string to a human-readable label.
 */
export function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'weekly': return 'Weekly';
    case 'bi_weekly':
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    default: return 'Periodic';
  }
}

/**
 * Map a ContractPaymentFrequency string to the Stripe recurring interval.
 */
export function getStripeInterval(frequency: string): { interval: 'week' | 'month'; interval_count: number } {
  switch (frequency) {
    case 'weekly': return { interval: 'week', interval_count: 1 };
    case 'bi_weekly':
    case 'fortnightly': return { interval: 'week', interval_count: 2 };
    case 'monthly':
    default: return { interval: 'month', interval_count: 1 };
  }
}
