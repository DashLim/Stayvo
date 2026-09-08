import Link from 'next/link';
import { STAYVO_PRO_PROFILE_HREF } from '@/lib/stayvo-pro';

export default function NoPropertiesEmptyState({
  returnTo,
  canAddProperty = true,
}: {
  returnTo: string;
  canAddProperty?: boolean;
}) {
  return (
    <div className="glass rounded-[20px] p-6 text-center md:p-8">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        No properties yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        Add your first property to start sharing check-in details, house rules, and guest links.
      </p>
      {canAddProperty ? (
        <Link
          href={`/properties/new?returnTo=${encodeURIComponent(returnTo)}`}
          prefetch={false}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        >
          + Add your first property
        </Link>
      ) : (
        <Link
          href={STAYVO_PRO_PROFILE_HREF}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-brand/60 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
        >
          Upgrade to add more properties
        </Link>
      )}
    </div>
  );
}
