import { Skeleton } from '@/app/_components/Skeleton';

function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="py-6">
      {/* Location section */}
      {[2, 3].map((count, i) => (
        <div key={i} className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <Skeleton className="h-4 w-24" />
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: count }).map((_, j) => (
              <PropertyCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
