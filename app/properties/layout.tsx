import HostShell from '@/app/_components/HostShell';

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <HostShell className="min-h-screen w-full bg-muted/20">{children}</HostShell>
  );
}
