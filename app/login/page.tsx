import { Suspense } from 'react';
import LoginPageClient from '@/app/login/LoginPageClient';
import { Skeleton } from '@/app/_components/Skeleton';

export const dynamic = 'force-dynamic';

function LoginSkeleton() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
        <div className="mt-6 space-y-4">
          <div>
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-1.5 h-10 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-1.5 h-10 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="mt-6 h-10 w-full rounded-xl" />
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageClient />
    </Suspense>
  );
}

