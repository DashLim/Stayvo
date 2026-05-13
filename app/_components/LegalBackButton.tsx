'use client';

import { useRouter } from 'next/navigation';
import PressButton from '@/app/_components/PressButton';

export default function LegalBackButton() {
  const router = useRouter();

  return (
    <div className="-mx-4 sticky top-0 z-30 mb-6 border-b border-slate-200/60 bg-[var(--bg-base)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-white/10">
      <div className="mx-auto max-w-3xl">
        <PressButton
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:bg-white dark:border-white/18 dark:bg-white/18 dark:text-slate-900 dark:hover:bg-white/28 dark:hover:text-slate-950"
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
    </div>
  );
}
