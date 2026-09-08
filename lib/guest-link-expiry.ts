/** Checkout date (YYYY-MM-DD) → expires end of checkout+2 days UTC. */
export function calculateExpiryIso(checkoutDate: string): string {
  const date = new Date(`${checkoutDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid checkout date.');
  }
  date.setUTCDate(date.getUTCDate() + 2);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}
