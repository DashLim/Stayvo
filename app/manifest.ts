import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Stayvo',
    short_name: 'Stayvo',
    description: 'Digital guest portal for short-term rentals',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#E0A24D',
    icons: [
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon',       sizes: '192x192', type: 'image/png' },
      { src: '/icon',       sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
