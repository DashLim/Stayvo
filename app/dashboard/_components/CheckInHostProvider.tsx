'use client';

import { createContext, useContext } from 'react';

/** Dashboard session: Check-in product access + usage counts (not billing tier). */
export type CheckInHostContext = {
  /** Full Stayvo Check-in host features (not Stripe tier). */
  checkInAccess: boolean;
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
      propertyCount: 0,
      locationCount: 0,
    };
  }
  return ctx;
}
