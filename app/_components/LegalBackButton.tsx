'use client';

import { useRouter } from 'next/navigation';
import PressButton from '@/app/_components/PressButton';

export default function LegalBackButton() {
  const router = useRouter();

  return (
    <div className="mx-auto mb-6 max-w-3xl px-4">
      <PressButton
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white"
        aria-label="Go back"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 0 1 0 1.414L9.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4a1 1 0 0 1 1.414 0Z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </PressButton>
    </div>
  );
}
