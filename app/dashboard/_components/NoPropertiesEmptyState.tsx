import Link from 'next/link';

export default function NoPropertiesEmptyState({ returnTo }: { returnTo: string }) {
  return (
    <div className="glass rounded-[20px] p-6 text-center md:p-8">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        No properties yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        Add your first property to start sharing check-in details, house rules, and guest links.
      </p>
      <Link
        href={`/properties/new?returnTo=${encodeURIComponent(returnTo)}`}
        prefetch={false}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
      >
        + Add your first property
      </Link>
    </div>
  );
}
