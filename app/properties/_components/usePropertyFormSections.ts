'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PROPERTY_FORM_SECTION_IDS,
  getDefaultPropertyFormSectionsOpen,
  loadPropertyFormSectionsOpen,
  propertyFormSectionsStorageKey,
  savePropertyFormSectionsOpen,
  type PropertyFormSectionId,
} from '@/lib/property-form-sections';

export function usePropertyFormSections(
  propertyId: string | undefined,
  mode: 'create' | 'edit'
) {
  const storageKey = useMemo(
    () => propertyFormSectionsStorageKey(propertyId, mode),
    [propertyId, mode]
  );
  const defaults = useMemo(() => getDefaultPropertyFormSectionsOpen(), []);

  const [openSections, setOpenSections] =
    useState<Record<PropertyFormSectionId, boolean>>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpenSections(loadPropertyFormSectionsOpen(storageKey, defaults));
    setHydrated(true);
  }, [storageKey, defaults]);

  useEffect(() => {
    if (!hydrated) return;
    savePropertyFormSectionsOpen(storageKey, openSections);
  }, [openSections, storageKey, hydrated]);

  const isSectionOpen = useCallback(
    (id: PropertyFormSectionId) => openSections[id] ?? false,
    [openSections]
  );

  const toggleSection = useCallback((id: PropertyFormSectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAllSections = useCallback(() => {
    setOpenSections(
      Object.fromEntries(
        PROPERTY_FORM_SECTION_IDS.map((id) => [id, true])
      ) as Record<PropertyFormSectionId, boolean>
    );
  }, []);

  const collapseAllSections = useCallback(() => {
    setOpenSections(
      Object.fromEntries(
        PROPERTY_FORM_SECTION_IDS.map((id) => [id, false])
      ) as Record<PropertyFormSectionId, boolean>
    );
  }, []);

  return {
    isSectionOpen,
    toggleSection,
    expandAllSections,
    collapseAllSections,
  };
}
