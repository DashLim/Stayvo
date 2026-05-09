'use client';

import ManageDashboardClient from '@/app/dashboard/manage/ManageDashboardClient';

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

export default function ManageDashboardClientNoSSR({
  locationGroups,
}: {
  locationGroups: Group[];
}) {
  return <ManageDashboardClient locationGroups={locationGroups} />;
}
