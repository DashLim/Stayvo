'use client';

import { createContext, useContext } from 'react';

import type { HostTier } from '@/lib/host-tier';

/** Dashboard session: Check-in product access + legacy billing tier + usage counts. */
export type CheckInHostContext = {
  /** Full Stayvo Check-in host features (not Stripe tier). */
  checkInAccess: boolean;
  /** Legacy `host_plan.tier` for Profile / Stripe UI only. */
  billingTier: HostTier;
  propertyCount: number;
  locationCount: number;
};

const CheckInHostContextReact = createContext<CheckInHostContext | null>(null);

export function CheckInHostProvider({
  value,
  children,
}: {
  value: CheckInHostContext;
  children: React.ReactNode;
}) {
  return (
    <CheckInHostContextReact.Provider value={value}>{children}</CheckInHostContextReact.Provider>
  );
}

export function useCheckInHostContext(): CheckInHostContext {
  const ctx = useContext(CheckInHostContextReact);
  if (!ctx) {
    return {
      checkInAccess: false,
      billingTier: 'free',
      propertyCount: 0,
      locationCount: 0,
    };
  }
  return ctx;
}

/** @deprecated Use {@link CheckInHostProvider} and {@link useCheckInHostContext}. */
export const HostTierProvider = CheckInHostProvider;

/** @deprecated Use {@link useCheckInHostContext}. */
export function useHostDashboardLimits(): CheckInHostContext {
  return useCheckInHostContext();
}

export type HostDashboardLimits = CheckInHostContext;
