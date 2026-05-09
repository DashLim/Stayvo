import { notFound } from 'next/navigation';
import GuestPortalPage from '@/app/_guest/GuestPortalPage';
import { slugBlocksCustomGuestPortalRoute } from '@/lib/guest-portal-url';

export default async function HostSlugGuestPortalPage({
  params,
}: {
  params: Promise<{ hostSlug: string; token: string }>;
}) {
  const { hostSlug, token } = await params;
  if (slugBlocksCustomGuestPortalRoute(hostSlug)) notFound();
  return <GuestPortalPage token={token} />;
}
