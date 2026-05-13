export const FIXED_TOP_SECTIONS = ['address', 'checkin', 'parking'] as const;
export const MIDDLE_BASE_SECTIONS = ['wifi', 'faq', 'rules'] as const;
export const FIXED_BOTTOM_SECTIONS = ['host'] as const;

/** Default guest section order (no custom blocks). Top/bottom are fixed; middle is reorderable. */
export const BASE_SECTION_KEYS = [
  ...FIXED_TOP_SECTIONS,
  ...MIDDLE_BASE_SECTIONS,
  ...FIXED_BOTTOM_SECTIONS,
] as const;

export type BaseSectionKey = (typeof BASE_SECTION_KEYS)[number];

export type CustomDetail = {
  detail_order: number;
  title: string;
  message: string;
  guest_image_path?: string | null;
  drive_media_url?: string | null;
};

function normalizeKey(value: string | null | undefined) {
  return (value ?? '').trim();
}

export function buildAllowedSectionKeys(customDetails: CustomDetail[]) {
  return [
    ...FIXED_TOP_SECTIONS,
    ...MIDDLE_BASE_SECTIONS,
    ...customDetails.map((d) => `custom:${d.detail_order}`),
    ...FIXED_BOTTOM_SECTIONS,
  ];
}

/**
 * Full section order: Address → Check-in → Parking (fixed), then middle blocks
 * (Wi‑Fi, FAQ, rules, custom boxes in host-chosen order), then Host (fixed last).
 */
export function normalizeSectionOrder(
  order: string[] | null | undefined,
  customDetails: CustomDetail[]
) {
  const allowedMiddle = new Set<string>([
    ...MIDDLE_BASE_SECTIONS,
    ...customDetails.map((d) => `custom:${d.detail_order}`),
  ]);

  const middleFromOrder: string[] = [];
  for (const raw of order ?? []) {
    const key = normalizeKey(raw);
    if (!key || !allowedMiddle.has(key) || middleFromOrder.includes(key)) continue;
    middleFromOrder.push(key);
  }

  const defaultMiddle: string[] = [
    ...MIDDLE_BASE_SECTIONS,
    ...customDetails.map((d) => `custom:${d.detail_order}`),
  ];
  for (const key of defaultMiddle) {
    if (allowedMiddle.has(key) && !middleFromOrder.includes(key)) {
      middleFromOrder.push(key);
    }
  }

  return [
    ...FIXED_TOP_SECTIONS,
    ...middleFromOrder,
    ...FIXED_BOTTOM_SECTIONS,
  ] as string[];
}

/** Middle keys from a stored full order (for drag UI). */
export function getMiddleSectionKeysFromOrder(
  order: string[],
  customDetails: CustomDetail[]
): string[] {
  const allowedMiddle = new Set<string>([
    ...MIDDLE_BASE_SECTIONS,
    ...customDetails.map((d) => `custom:${d.detail_order}`),
  ]);
  return order.filter((k) => allowedMiddle.has(k));
}

/** Normalize jsonb / legacy shapes from Postgres for safe client serialization */
export function parseGuestSectionOrderFromDb(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const keys = value.map((x) => String(x).trim()).filter(Boolean);
    return keys.length ? keys : undefined;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        const keys = parsed.map((x) => String(x).trim()).filter(Boolean);
        return keys.length ? keys : undefined;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}
