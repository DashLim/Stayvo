function normalizeWhitespace(value: string) {
  return value.trim();
}

export function validateAirbnbImportInput(url: string) {
  const raw = normalizeWhitespace(url);
  if (!raw) {
    return {
      ok: false as const,
      error: 'Please paste an Airbnb listing URL.',
    };
  }
  if (raw.length > 600) {
    return {
      ok: false as const,
      error: 'Listing URL is too long.',
    };
  }
  return { ok: true as const, url: raw };
}
