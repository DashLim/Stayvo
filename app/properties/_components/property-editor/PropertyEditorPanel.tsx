import { cn } from '@/lib/utils';

export default function PropertyEditorPanel({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6',
        className,
      )}
    >
      <header className="mb-5 border-b border-border/60 pb-4">
        <h2 className="font-serif text-2xl font-light tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
