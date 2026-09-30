'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  modulesForMode,
  propertyEditorModuleStorageKey,
  type PropertyEditorModuleId,
} from '@/app/properties/_components/property-editor/property-editor-modules';

const DEFAULT_MODULE: PropertyEditorModuleId = 'hero';

export function usePropertyEditorModule(propertyId: string | undefined, mode: 'create' | 'edit') {
  const storageKey = propertyEditorModuleStorageKey(propertyId, mode);
  const [activeModule, setActiveModuleState] = useState<PropertyEditorModuleId>(DEFAULT_MODULE);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const allowed = new Set(modulesForMode(mode).map((m) => m.id));
      if (allowed.has(raw as PropertyEditorModuleId)) {
        setActiveModuleState(raw as PropertyEditorModuleId);
      }
    } catch {
      // ignore
    }
  }, [storageKey, mode]);

  const setActiveModule = useCallback(
    (id: PropertyEditorModuleId) => {
      setActiveModuleState(id);
      setMobileNavOpen(false);
      try {
        window.localStorage.setItem(storageKey, id);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  return {
    activeModule,
    setActiveModule,
    mobileNavOpen,
    setMobileNavOpen,
  };
}
