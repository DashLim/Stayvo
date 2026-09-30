'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  modulesForMode,
  type PropertyEditorModuleDef,
  type PropertyEditorModuleId,
} from '@/app/properties/_components/property-editor/property-editor-modules';

export default function PropertyEditorMobileNav({
  open,
  onOpenChange,
  mode,
  activeModule,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  activeModule: PropertyEditorModuleId;
  onSelect: (id: PropertyEditorModuleId) => void;
}) {
  const modules = modulesForMode(mode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light">Editor sections</DialogTitle>
        </DialogHeader>
        <ul className="mt-2 space-y-0.5">
          {modules.map((mod) => (
            <MobileNavItem
              key={mod.id}
              mod={mod}
              active={activeModule === mod.id}
              onSelect={() => onSelect(mod.id)}
            />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function MobileNavItem({
  mod,
  active,
  onSelect,
}: {
  mod: PropertyEditorModuleDef;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = mod.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
          active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/80',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {mod.label}
      </button>
    </li>
  );
}
