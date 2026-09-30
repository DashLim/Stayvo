import ForceLightOnLogin from '@/app/login/ForceLightOnLogin';
import HostShell from '@/app/_components/HostShell';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <HostShell className="min-h-screen bg-muted/20">
      <ForceLightOnLogin />
      <div className="mx-auto w-full max-w-2xl px-4 py-8">{children}</div>
    </HostShell>
  );
}
