import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import AppSplash from '@/app/_components/AppSplash';
import ThemeHydration from '@/app/_components/ThemeHydration';
import PageTransition from '@/app/_components/PageTransition';
import ServiceWorkerRegister from '@/app/_components/ServiceWorkerRegister';
import SupabaseSessionRecovery from '@/app/_components/SupabaseSessionRecovery';
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
    // default: solid bar on white; avoids dark band when launching PWA
    statusBarStyle: 'default',
    title: 'Stayvo',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    // Light: white first paint when opening from home screen (matches startup splash)
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111014' },
  ],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Startup splash: critical CSS before globals.css so first paint is white + layout (not black WebView) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `.stayvo-app-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);background:#fff}.stayvo-app-splash__logo{width:min(26vw,120px);height:auto;max-height:min(14vh,108px);object-fit:contain}`,
          }}
        />
        <link rel="preload" href="/brand/stayvo-splash-logo.png" as="image" type="image/png" />
      </head>
      <body className="min-h-screen font-sans">
        <ThemeHydration />
        <AppSplash />
        <SupabaseSessionRecovery>
          <PageTransition>{children}</PageTransition>
        </SupabaseSessionRecovery>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
