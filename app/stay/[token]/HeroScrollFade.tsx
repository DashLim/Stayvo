'use client';

import { useEffect } from 'react';

/**
 * Attaches a passive scroll listener to the hero image (#hero-img).
 * As the user scrolls down the image slowly moves up (parallax) and fades out,
 * giving the Airbnb-style "content slides over photo" feel.
 */
export default function HeroScrollFade() {
  useEffect(() => {
    const img = document.getElementById('hero-img') as HTMLImageElement | null;
    const overlay = document.getElementById('hero-overlay') as HTMLDivElement | null;
    if (!img) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      // Parallax: image moves up at 30% of scroll speed
      img.style.transform = `translateY(${scrollY * 0.3}px)`;
      // Fade: fully faded by the time scroll = 380px
      const opacity = Math.max(0, 1 - scrollY / 380);
      img.style.opacity = String(opacity);
      // Darken overlay slightly as hero fades
      if (overlay) {
        overlay.style.opacity = String(Math.min(1, 0.55 + scrollY / 600));
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Reset on unmount (navigation)
    return () => {
      window.removeEventListener('scroll', onScroll);
      img.style.transform = '';
      img.style.opacity = '';
      if (overlay) overlay.style.opacity = '';
    };
  }, []);

  return null;
}
