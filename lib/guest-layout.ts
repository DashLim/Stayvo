export const BASE_SECTION_KEYS = [
  'address',
  'parking',
  'checkin',
  'wifi',
  'rules',
  'guidebook',
  'host',
] as const;

export type BaseSectionKey = (typeof BASE_SECTION_KEYS)[number];

export type CustomDetail = {
  detail_order: number;
  title: string;
  message: string;
};

function normalizeKey(value: string | null | undefined) {
  return (value ?? '').trim();
}

export function buildAllowedSectionKeys(customDetails: CustomDetail[]) {
  return [
    ...BASE_SECTION_KEYS,
    ...customDetails.map((d) => `custom:${d.detail_order}`),
  ];
}

export function normalizeSectionOrder(
  order: string[] | null | undefined,
  customDetails: CustomDetail[]
) {
  const allowed = new Set(buildAllowedSectionKeys(customDetails));
  const out: string[] = [];

  for (const raw of order ?? []) {
    const key = normalizeKey(raw);
    if (!key || !allowed.has(key) || out.includes(key)) continue;
    out.push(key);
  }

  for (const key of buildAllowedSectionKeys(customDetails)) {
    if (!out.includes(key)) out.push(key);
  }

  return out;
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
