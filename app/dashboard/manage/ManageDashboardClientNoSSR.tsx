'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/app/_components/Skeleton';

type LocRow = { id: string; name: string };
type PropRow = {
  id: string;
  property_name: string;
  internal_name: string | null;
  location_id: string;
  sort_order: number;
  is_live: boolean;
};
type Group = { location: LocRow; properties: PropRow[] };

function ManageSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      {[3, 2].map((count, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Location header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          {/* Property rows */}
          <ul className="mt-3 divide-y divide-slate-100">
            {Array.from({ length: count }).map((_, j) => (
              <li key={j} className="flex items-center justify-between py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-7 w-12 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const ManageDashboardClient = dynamic(
  () => import('@/app/dashboard/manage/ManageDashboardClient'),
  {
    ssr: false,
    loading: () => <ManageSkeleton />,
  }
);

export default function ManageDashboardClientNoSSR({
  locationGroups,
}: {
  locationGroups: Group[];
}) {
  return <ManageDashboardClient locationGroups={locationGroups} />;
}
