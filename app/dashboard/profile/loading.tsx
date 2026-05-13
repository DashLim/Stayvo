import { Skeleton } from '@/app/_components/Skeleton';

function FormCardSkeleton({ fields = 1 }: { fields?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <Skeleton className="h-4 w-32" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: fields }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-3 h-9 w-24 rounded-xl" />
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="mt-8 max-w-md space-y-8">
      {/* Current email */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <FormCardSkeleton fields={1} />
      <FormCardSkeleton fields={1} />
      <FormCardSkeleton fields={2} />
      {/* Danger zone */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
