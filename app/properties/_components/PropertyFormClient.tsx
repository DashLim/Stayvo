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
      <main className="mx-auto w-full max-w-6xl animate-pulse px-4 pb-10 pt-4 lg:px-6">
        <div className="h-14 rounded-md bg-muted" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="hidden h-64 w-64 rounded-md bg-muted lg:block" />
          <div className="h-96 flex-1 rounded-xl bg-muted" />
        </div>
      </main>
    ),
  }
);

export default function PropertyFormClient(props: PropertyFormProps) {
  return <PropertyForm {...props} />;
}
