'use client';

import {
  googleDriveFileIdFromUrl,
  googleDriveImageViewUrl,
  googleDrivePreviewEmbedUrl,
} from '@/lib/google-drive-embed';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type EmbedKind = 'loading' | 'image' | 'iframe';

function DriveIframeModal({
  src,
  open,
  onClose,
}: {
  src: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Media playback"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          title="Media from Google Drive"
          src={src}
          className="aspect-video w-full min-h-[220px] border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>,
    document.body
  );
}

export default function DriveMediaEmbed({
  url,
}: {
  url: string | null | undefined;
}) {
  const id = googleDriveFileIdFromUrl(url);
  const previewSrc = googleDrivePreviewEmbedUrl(url);
  const [kind, setKind] = useState<EmbedKind>('loading');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    setPosterFailed(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const src = googleDriveImageViewUrl(id);
    const probe = new Image();
    probe.onload = () => setKind('image');
    probe.onerror = () => setKind('iframe');
    probe.referrerPolicy = 'no-referrer';
    probe.src = src;
  }, [id]);

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

  if (!previewSrc || !id) return null;

  if (kind === 'loading') {
    return (
      <div
        className="mt-3 aspect-video animate-pulse rounded-xl border border-slate-200 bg-slate-200"
        aria-hidden
      />
    );
  }

  const imgSrc = googleDriveImageViewUrl(id);

  if (kind === 'iframe') {
    return (
      <>
        <button
          type="button"
          onClick={() => setVideoModalOpen(true)}
          className="group relative mt-3 flex w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Play media"
        >
          {!posterFailed ? (
            <img
              src={imgSrc}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setPosterFailed(true)}
              className="aspect-video w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
          ) : (
            <div className="aspect-video w-full bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg ring-2 ring-white/80">
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-7 w-7"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
          </span>
        </button>
        <DriveIframeModal
          src={previewSrc}
          open={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group mt-3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Enlarge image"
      >
        <img
          src={imgSrc}
          alt=""
          referrerPolicy="no-referrer"
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
                src={imgSrc}
                alt=""
                referrerPolicy="no-referrer"
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
