import { Skeleton } from '@/app/_components/Skeleton';
import { stayvoHostCardClass } from '@/lib/stayvo-ui-classes';

function LocationPanelSkeleton({ propertyCount }: { propertyCount: number }) {
  return (
    <div className={`${stayvoHostCardClass} p-4 md:p-6`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-md md:w-28" />
      </div>
      <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
        {Array.from({ length: propertyCount }).map((_, j) => (
          <li key={j} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ManageLoading() {
  return (
    <div className="mt-4 space-y-6 md:mt-6">
      <div className="md:hidden space-y-6">
        <LocationPanelSkeleton propertyCount={3} />
        <LocationPanelSkeleton propertyCount={2} />
      </div>
      <div className="hidden md:flex md:gap-8">
        <aside className="w-64 shrink-0 space-y-1">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </aside>
        <div className="min-w-0 flex-1">
          <LocationPanelSkeleton propertyCount={3} />
        </div>
      </div>
    </div>
  );
}
