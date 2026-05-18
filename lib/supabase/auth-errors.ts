/** True when Supabase cannot refresh the session (stale or revoked cookies). */
export function isRefreshTokenUnusable(
  err: { message?: string; code?: string } | null | undefined
): boolean {
  if (!err) return false;
  const code = err.code ?? '';
  if (code === 'refresh_token_not_found' || code === 'invalid_refresh_token') {
    return true;
  }
  const m = err.message ?? '';
  return (
    m.includes('Invalid Refresh Token') ||
    m.includes('Refresh Token Not Found') ||
    m.includes('refresh_token_not_found')
  );
}
