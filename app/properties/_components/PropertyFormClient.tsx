'use client';

import dynamic from 'next/dynamic';
import type { PropertyFormProps } from './PropertyForm';

/**
 * Load the heavy property editor only in the browser. Prevents flaky SSR/webpack
 * errors (`__webpack_modules__[moduleId] is not a function`) from @dnd-kit / bundle splits.
 */
const PropertyForm = dynamic(
  () => import('./PropertyForm').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <main className="mx-auto w-full max-w-5xl pb-10">
        <header className="glass-header sticky top-0 z-30 -mx-4 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-7 flex-1 animate-pulse rounded-full bg-slate-200/80" />
            </div>
            <div className="ml-auto flex gap-2">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/80" />
              <div className="h-10 min-w-[5.5rem] animate-pulse rounded-full bg-slate-200/80" />
            </div>
          </div>
        </header>
        <div className="mt-6 space-y-5 px-1">
          <div className="h-40 animate-pulse rounded-[20px] bg-white/60" />
          <div className="h-48 animate-pulse rounded-[20px] bg-white/60" />
          <div className="h-36 animate-pulse rounded-[20px] bg-white/60" />
        </div>
      </main>
    ),
  }
);

export default function PropertyFormClient(props: PropertyFormProps) {
  return <PropertyForm {...props} />;
}
