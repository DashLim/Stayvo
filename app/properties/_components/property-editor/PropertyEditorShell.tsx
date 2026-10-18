export default function PropertyEditorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl pb-8 pt-1 md:pb-16 md:pt-2">
      {children}
    </main>
  );
}
