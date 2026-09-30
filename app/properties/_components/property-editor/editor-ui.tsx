import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}

export function FieldGroup({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      {children}
    </div>
  );
}

export function EditorListShell({
  title,
  actions,
  children,
  className,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function EditorEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
