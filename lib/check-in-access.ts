/**
 * Stayvo Check-in **product access** (distinct from Stripe `host_plan` billing tier).
 *
 * Today: any authenticated Supabase Auth user (`auth.users.id`) has full Check-in access.
 * Future: access may be granted or revoked via Stayvo Core provisioning → Supabase identity mapping.
 * See docs/stayvo-identity.md.
 */

/** Whether a Supabase Auth user id qualifies for Stayvo Check-in host features. */
export function hasCheckInAccessForAuthUser(
  userId: string | null | undefined
): userId is string {
  return typeof userId === 'string' && userId.trim().length > 0;
}

/**
 * Server-side guard message when Check-in access is required but missing.
 * Middleware already redirects unauthenticated users away from /dashboard and /properties.
 */
export function checkInAccessDeniedMessage(): string {
  return 'Sign in to use Stayvo Check-in.';
}
