'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Eye, LayoutList, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { stayvoHostHeaderClass } from '@/lib/stayvo-ui-classes';
import { cn } from '@/lib/utils';
import type { PropertyEditorModuleId } from '@/app/properties/_components/property-editor/property-editor-modules';

type PropertyEditorHeaderProps = {
  mode: 'create' | 'edit';
  propertyId?: string;
  title: string;
  submitting: boolean;
  deleting: boolean;
  onBack: () => void;
  onSave: () => void;
  onOpenModulePicker: () => void;
  onSelectModule: (id: PropertyEditorModuleId) => void;
};

export default function PropertyEditorHeader({
  mode,
  propertyId,
  title,
  submitting,
  deleting,
  onBack,
  onSave,
  onOpenModulePicker,
  onSelectModule,
}: PropertyEditorHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      const root = document.getElementById('property-edit-header-menu');
      if (root && target && !root.contains(target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen]);

  const saveLabel = submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save';
  const saveAriaLabel = mode === 'create' ? 'Create property' : 'Save property';

  return (
    <header
      className={cn(
        stayvoHostHeaderClass,
        'px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:px-6 lg:px-8',
      )}
    >
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center gap-2 overflow-hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="min-w-0 flex-1 truncate font-serif text-xl font-light tracking-tight text-foreground sm:text-2xl md:text-3xl">
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 lg:hidden"
            onClick={onOpenModulePicker}
            aria-label="Choose section"
          >
            <LayoutList className="h-4 w-4" />
          </Button>

          <div id="property-edit-header-menu" className="relative md:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label="More actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg">
                {mode === 'edit' && propertyId ? (
                  <Link
                    href={`/properties/${propertyId}/preview`}
                    prefetch={false}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Guest preview
                  </Link>
                ) : null}
                {mode === 'edit' ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      onSelectModule('section-order');
                    }}
                  >
                    Reorder sections
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {mode === 'edit' && propertyId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/properties/${propertyId}/preview`} prefetch={false}>
                  <Eye className="h-4 w-4" />
                  Preview
                </Link>
              </Button>
            ) : null}
            {mode === 'edit' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelectModule('section-order')}
              >
                Reorder
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            disabled={submitting || deleting}
            onClick={onSave}
            className="h-10 w-10 shrink-0 p-0 md:hidden"
            aria-label={saveAriaLabel}
          >
            <Check className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            disabled={submitting || deleting}
            onClick={onSave}
            className="hidden h-10 min-w-[5.25rem] md:inline-flex"
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
