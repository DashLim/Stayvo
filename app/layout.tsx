import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import PageTransition from '@/app/_components/PageTransition';
import ServiceWorkerRegister from '@/app/_components/ServiceWorkerRegister';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Stayvo',
  description: 'Digital guest portal for short-term rentals',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stayvo',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#FDF6EC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        {process.env.NODE_ENV !== 'production' ? (
          <Script
            id="dev-clear-service-workers"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html:
                "if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});}if('caches' in window){caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});}",
            }}
          />
        ) : null}
        <div className="mx-auto w-full max-w-2xl px-4">
          <PageTransition>{children}</PageTransition>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
