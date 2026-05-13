export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-neutral-800 dark:ring-1 dark:ring-inset dark:ring-white/[0.06] ${className}`}
      aria-hidden
    />
  );
}
