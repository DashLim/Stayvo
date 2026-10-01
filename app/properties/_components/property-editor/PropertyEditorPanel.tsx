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
        'rounded-lg border border-border bg-card p-3 shadow-xs sm:p-6',
        className,
      )}
    >
      <header className="mb-4 border-b border-border/60 pb-3 sm:mb-5 sm:pb-4">
        <h2 className="font-serif text-xl font-light tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
