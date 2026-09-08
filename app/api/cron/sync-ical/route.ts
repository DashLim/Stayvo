import { NextResponse } from 'next/server';
import { getServiceRoleSupabase } from '@/lib/supabase/admin';
import { syncAllEnabledIcalFeeds } from '@/lib/ical/sync-feed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceRoleSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
      { status: 500 }
    );
  }

  try {
    const results = await syncAllEnabledIcalFeeds(supabase);
    const errors = results.filter((r) => r.error);
    return NextResponse.json({
      ok: true,
      synced: results.length,
      errors: errors.length,
      results,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
