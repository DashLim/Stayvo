import type { ReactNode } from 'react';

export default function GuestSectionHeading({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-foreground md:text-base">
      <span className="text-primary">{icon}</span>
      {label}
    </h2>
  );
}
