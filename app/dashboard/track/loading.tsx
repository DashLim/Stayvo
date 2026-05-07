import { Skeleton } from '@/app/_components/Skeleton';

export default function TrackLoading() {
  return (
    <div className="mt-8 space-y-10">
      {[2, 1].map((count, i) => (
        <div key={i}>
          <Skeleton className="h-3.5 w-24" />
          <div className="mt-3 space-y-6">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Skeleton className="h-5 w-40" />
                <div className="mt-3 space-y-3">
                  {[1, 2].map((_, k) => (
                    <div key={k} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-1.5 h-3 w-36" />
                      <Skeleton className="mt-2 h-3 w-48" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
