'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-97YKR52LHW';

const RESERVED_FIRST_SEGMENTS = new Set([
  'login',
  'signup',
  'dashboard',
  'properties',
  'privacy',
  'terms',
  'auth',
  'stay',
  'api',
]);

/** Guest portal URLs: /stay/[token] or /[hostSlug]/[token] (not reserved app routes). */
function isGuestPortalPath(pathname: string): boolean {
  if (pathname.startsWith('/stay/')) return true;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 2 && !RESERVED_FIRST_SEGMENTS.has(segments[0])) {
    return true;
  }
  return false;
}

/** Load GA in production only so local dev does not pollute reports. */
const enabled =
  process.env.NODE_ENV === 'production' && GA_MEASUREMENT_ID.length > 0;

export default function GoogleAnalytics() {
  const pathname = usePathname() ?? '/';

  if (!enabled || isGuestPortalPath(pathname)) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
