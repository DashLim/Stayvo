import { Skeleton } from '@/app/_components/Skeleton';
import { stayvoHostCardClass } from '@/lib/stayvo-ui-classes';

function GuestLinkRowSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <div className="mt-2 flex gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

function TrackPropertyCardSkeleton({ linkCount }: { linkCount: number }) {
  return (
    <div className={`${stayvoHostCardClass} p-4 md:p-5`}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-3 space-y-2 border-b border-border pb-3">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: linkCount }).map((_, i) => (
          <GuestLinkRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function MobilePropertyBlockSkeleton({ linkCount }: { linkCount: number }) {
  return (
    <div className={`${stayvoHostCardClass} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: linkCount }).map((_, i) => (
          <GuestLinkRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function TrackLoading() {
  return (
    <div className="mt-4 space-y-6 md:mt-6">
      <div className="space-y-8 md:hidden">
        <div>
          <div className="mb-4 border-b border-border pb-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
          <div className="space-y-5">
            <MobilePropertyBlockSkeleton linkCount={2} />
            <MobilePropertyBlockSkeleton linkCount={1} />
          </div>
        </div>
      </div>
      <div className="hidden md:flex md:gap-8">
        <aside className="w-64 shrink-0 space-y-1">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 border-b border-border pb-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <TrackPropertyCardSkeleton linkCount={2} />
            <TrackPropertyCardSkeleton linkCount={1} />
          </div>
        </div>
      </div>
    </div>
  );
}
