'use client';

import { cn } from '@/lib/utils';
import {
  modulesForMode,
  type PropertyEditorModuleDef,
  type PropertyEditorModuleId,
} from '@/app/properties/_components/property-editor/property-editor-modules';

export default function PropertyEditorNav({
  mode,
  activeModule,
  onSelect,
}: {
  mode: 'create' | 'edit';
  activeModule: PropertyEditorModuleId;
  onSelect: (id: PropertyEditorModuleId) => void;
}) {
  const modules = modulesForMode(mode);

  return (
    <nav
      className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex"
      aria-label="Property editor sections"
    >
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto p-4">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Modules
        </p>
        <ul className="space-y-0.5">
          {modules.map((mod) => (
            <NavItem
              key={mod.id}
              mod={mod}
              active={activeModule === mod.id}
              onSelect={() => onSelect(mod.id)}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavItem({
  mod,
  active,
  onSelect,
}: {
  mod: PropertyEditorModuleDef;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = mod.icon;
  const destructive = mod.id === 'danger-zone';

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
          destructive && !active && 'text-destructive hover:bg-destructive/10',
          !destructive && !active && 'text-muted-foreground hover:bg-muted hover:text-foreground',
          active &&
            (destructive
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-foreground'),
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{mod.label}</span>
      </button>
    </li>
  );
}
