export default function StayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 md:max-w-none md:px-0">{children}</div>
  );
}
