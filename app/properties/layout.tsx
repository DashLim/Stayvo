export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)]">{children}</div>
  );
}
