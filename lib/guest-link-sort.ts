/** Normalize checkout_date from DB (date or timestamptz string) to YYYY-MM-DD. */
export function checkoutDateKey(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw.slice(0, 10);
}

type GuestLinkSortable = {
  checkout_date?: string | null;
  is_permanent?: boolean | null;
};

/** Soonest checkout first; permanent links last. */
export function compareGuestLinksByCheckoutAsc(
  a: GuestLinkSortable,
  b: GuestLinkSortable
): number {
  const aPerm = a.is_permanent === true;
  const bPerm = b.is_permanent === true;
  if (aPerm !== bPerm) return aPerm ? 1 : -1;
  if (aPerm && bPerm) return 0;

  const aDate = checkoutDateKey(a.checkout_date);
  const bDate = checkoutDateKey(b.checkout_date);
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return aDate.localeCompare(bDate);
}

export function sortGuestLinksByCheckoutAsc<T extends GuestLinkSortable>(
  links: T[]
): T[] {
  return [...links].sort(compareGuestLinksByCheckoutAsc);
}
