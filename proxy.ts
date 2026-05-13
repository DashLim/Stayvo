import { updateSession } from '@/lib/supabase/middleware';
import {
  getAppHostname,
  getMarketingHostnames,
  isLocalDevHostname,
} from '@/lib/site-hosts';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const hostHeader = request.headers.get('host') ?? '';
  const host = hostHeader.split(':')[0] ?? '';
  const pathname = request.nextUrl.pathname;

  const appHost = getAppHostname();
  const marketingHosts = getMarketingHostnames();
  const local = isLocalDevHostname(host);

  const onApp = Boolean(appHost && host === appHost);
  const onMarketing = marketingHosts.includes(host);

  if (!local && onApp && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!local && onMarketing && appHost) {
    const pathRedirect =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/properties') ||
      pathname.startsWith('/login');
    if (pathRedirect) {
      const url = request.nextUrl.clone();
      url.hostname = appHost;
      url.protocol = 'https:';
      return NextResponse.redirect(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/login/:path*',
    '/dashboard/:path*',
    '/properties/:path*',
  ],
};
