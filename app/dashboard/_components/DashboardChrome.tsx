'use client';

import { useEffect, useState } from 'react';
import DashboardStickyHeader from '@/app/dashboard/_components/DashboardStickyHeader';
import HostBottomNav from '@/app/dashboard/_components/HostBottomNav';

export default function DashboardChrome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <DashboardStickyHeader />
      <HostBottomNav />
    </>
  );
}
