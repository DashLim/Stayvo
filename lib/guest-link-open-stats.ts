/** Stats returned by `get_guest_link_open_stats` RPC (after migration 0013). */
export type GuestLinkOpenStats = {
  deviceCount: number;
  totalOpens: number;
  lastOpenAt: string | null;
};

type RpcStatRow = {
  guest_link_id: string;
  device_count: number;
  total_opens: number | string | bigint;
  last_open_at: string | null;
};

/**
 * Turn RPC rows into a map keyed by guest link id for dashboard UI and helpers.
 * Device count is based on a random UUID stored in each guest browser’s localStorage.
 */
export function guestLinkOpenStatsByLinkId(
  rows: RpcStatRow[] | null | undefined
): Record<string, GuestLinkOpenStats> {
  const out: Record<string, GuestLinkOpenStats> = {};
  if (!rows?.length) return out;
  for (const r of rows) {
    const n =
      typeof r.total_opens === 'bigint'
        ? Number(r.total_opens)
        : typeof r.total_opens === 'string'
          ? Number(r.total_opens)
          : r.total_opens;
    out[r.guest_link_id] = {
      deviceCount: r.device_count,
      totalOpens: Number.isFinite(n) ? n : 0,
      lastOpenAt: r.last_open_at,
    };
  }
  return out;
}
