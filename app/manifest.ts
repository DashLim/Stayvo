import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stayvo',
    short_name: 'Stayvo',
    description: 'Digital guest portal for short-term rentals',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    // White so installed PWA / mobile shell splash matches in-app startup (avoids black flash)
    background_color: '#ffffff',
    theme_color: '#E0A24D',
    icons: [
      { src: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
