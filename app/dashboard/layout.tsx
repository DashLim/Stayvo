import DashboardChrome from '@/app/dashboard/_components/DashboardChrome';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <DashboardChrome />
      {children}
    </div>
  );
}
