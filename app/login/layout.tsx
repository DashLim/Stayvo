import ForceLightOnLogin from '@/app/login/ForceLightOnLogin';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ForceLightOnLogin />
      <div className="mx-auto w-full max-w-2xl px-4">{children}</div>
    </>
  );
}
