import { Suspense } from 'react';
import LoginPageClient from '@/app/login/LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Loading...</p>
          </section>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}

