'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="py-10">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {process.env.NODE_ENV === 'development' ? error.message : 'Please try again.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
