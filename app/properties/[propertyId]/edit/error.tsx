'use client';

export default function EditPropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[60vh] py-10">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <h1 className="text-lg font-semibold">Could not load this property</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Something failed while loading the edit page. If this keeps happening,
          check Vercel runtime logs for the full error. Common causes: Supabase
          URL/key mismatch on Vercel, or the database is missing columns from the
          latest migrations.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-rose-800">
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
