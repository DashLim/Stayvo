export default function PropertyEditorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[calc(72rem+16rem)] pb-10 pt-2 md:pb-16">
      {children}
    </main>
  );
}
