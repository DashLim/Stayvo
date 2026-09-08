export const PROPERTY_FORM_SECTION_IDS = [
  'hero',
  'property-details',
  'checkin',
  'house-rules',
  'faq',
  'social-links',
  'custom-blocks',
  'host-contact',
  'ical-sync',
  'danger-zone',
] as const;

export type PropertyFormSectionId = (typeof PROPERTY_FORM_SECTION_IDS)[number];

export function propertyFormSectionsStorageKey(
  propertyId: string | undefined,
  mode: 'create' | 'edit'
) {
  return `stayvo-property-form-sections:${propertyId ?? (mode === 'create' ? 'new' : 'unknown')}`;
}

export function getDefaultPropertyFormSectionsOpen(): Record<PropertyFormSectionId, boolean> {
  const state = Object.fromEntries(
    PROPERTY_FORM_SECTION_IDS.map((id) => [id, false])
  ) as Record<PropertyFormSectionId, boolean>;
  state.hero = true;
  state['property-details'] = true;
  return state;
}

export function loadPropertyFormSectionsOpen(
  key: string,
  defaults: Record<PropertyFormSectionId, boolean>
): Record<PropertyFormSectionId, boolean> {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<PropertyFormSectionId, boolean>>;
    const merged = { ...defaults };
    for (const id of PROPERTY_FORM_SECTION_IDS) {
      if (typeof parsed[id] === 'boolean') merged[id] = parsed[id];
    }
    return merged;
  } catch {
    return defaults;
  }
}

export function savePropertyFormSectionsOpen(
  key: string,
  state: Record<PropertyFormSectionId, boolean>
) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore quota / private browsing
  }
}
