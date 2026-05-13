'use client';

import { createContext, useContext } from 'react';

import type { HostTier } from '@/lib/host-tier';

export type HostDashboardLimits = {
  tier: HostTier;
  propertyCount: number;
  locationCount: number;
};

const HostTierContext = createContext<HostDashboardLimits | null>(null);

export function HostTierProvider({
  value,
  children,
}: {
  value: HostDashboardLimits;
  children: React.ReactNode;
}) {
  return <HostTierContext.Provider value={value}>{children}</HostTierContext.Provider>;
}

export function useHostDashboardLimits(): HostDashboardLimits {
  const ctx = useContext(HostTierContext);
  if (!ctx) {
    return { tier: 'free', propertyCount: 0, locationCount: 0 };
  }
  return ctx;
}
