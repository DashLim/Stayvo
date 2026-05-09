import GuestPortalPage from '@/app/_guest/GuestPortalPage';

/** Legacy URL shape; slug defaults to `stay` via `/stay/{token}`. */
export default async function StayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GuestPortalPage token={token} />;
}
