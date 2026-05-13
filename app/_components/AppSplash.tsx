'use client';

import { useEffect, useState } from 'react';

/**
 * Full-screen startup splash. Dismiss runs only after mount (post-hydration) so we
 * never remove/modify React-owned DOM before hydration — avoids hydration mismatches.
 *
 * Uses a plain <img> (not next/image) so the logo can decode and paint as soon as HTML arrives.
 */
export default function AppSplash() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onLoad() {
      setDismissed(true);
    }
    if (document.readyState === 'complete') {
      const id = requestAnimationFrame(() => setDismissed(true));
      return () => cancelAnimationFrame(id);
    }
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <div
      className={`stayvo-app-splash${dismissed ? ' stayvo-app-splash--out' : ''}`}
      aria-hidden
    >
      <img
        src="/brand/stayvo-splash-logo.png"
        alt=""
        width={467}
        height={512}
        decoding="sync"
        fetchPriority="high"
        className="stayvo-app-splash__logo"
      />
    </div>
  );
}
