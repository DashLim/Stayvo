import { Skeleton } from '@/app/_components/Skeleton';
import { stayvoHostCardClass } from '@/lib/stayvo-ui-classes';

function PropertyCardSkeleton() {
  return (
    <div className={`${stayvoHostCardClass} p-4 md:p-5`}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3 w-28" />
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="py-6 md:py-8">
      {[2, 3].map((count, i) => (
        <div key={i} className="mb-8 md:hidden">
          <div className="mb-4 border-b border-border pb-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: count }).map((_, j) => (
              <PropertyCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
      <div className="hidden md:block">
        <div className="mb-4 border-b border-border pb-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    </div>
  );
}
