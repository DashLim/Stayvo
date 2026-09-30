import { hostSans, hostSerif } from '@/lib/host-fonts';
import { cn } from '@/lib/utils';

export default function HostShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'stayvo-host min-h-full font-host antialiased',
        hostSans.variable,
        hostSerif.variable,
        className,
      )}
    >
      {children}
    </div>
  );
}
