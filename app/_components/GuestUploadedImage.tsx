'use client';

import { guestPropertyMediaPublicUrl } from '@/lib/guest-property-media';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function GuestUploadedImage({ path }: { path: string }) {
  const url = guestPropertyMediaPublicUrl(path);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group mt-3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Enlarge image"
      >
        <img
          src={url}
          alt=""
          className="max-h-[min(480px,70vh)] w-full cursor-zoom-in object-contain transition group-hover:opacity-95"
        />
      </button>
      {lightboxOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              onClick={() => setLightboxOpen(false)}
            >
              <img
                src={url}
                alt=""
                className="max-h-[min(92vh,100%)] max-w-[min(92vw,100%)] object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
}
