export type AutofillConfidence = 'high' | 'medium' | 'low';

export type AirbnbCheckInInstruction = {
  instruction: string;
  isDisplayed: boolean;
};

export type AirbnbHouseRule = {
  ruleText: string;
  isDisplayed: boolean;
};

export type AirbnbPrefill = {
  propertyName?: string;
  locationName?: string;
  fullAddress?: string;
  googleMapsUrl?: string;
  parkingDetails?: string;
  hostName?: string;
  socialAirbnbUrl?: string;
  checkInInstructions?: AirbnbCheckInInstruction[];
  houseRules?: AirbnbHouseRule[];
};

export type AirbnbSuggestion = {
  field: keyof AirbnbPrefill;
  confidence: AutofillConfidence;
  reason: string;
};

export type AirbnbExtractionResult = {
  prefill: AirbnbPrefill;
  suggestions: AirbnbSuggestion[];
  notes: string[];
  meta: {
    listingUrl: string;
    listingId: string | null;
    title: string | null;
  };
};

type JsonRecord = Record<string, unknown>;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function firstMatch(html: string, pattern: RegExp) {
  const m = html.match(pattern);
  return m?.[1] ? decodeHtmlEntities(normalizeWhitespace(m[1])) : '';
}

function extractMetaContent(html: string, attr: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  return firstMatch(html, re);
}

function parseJsonScriptBlocks(html: string) {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = (m[1] ?? '').trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      continue;
    }
  }
  return blocks;
}

function toRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function getNested(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    const rec = toRecord(current);
    if (!rec || !(key in rec)) return undefined;
    current = rec[key];
  }
  return current;
}

function asCleanString(value: unknown) {
  return typeof value === 'string' ? normalizeWhitespace(value) : '';
}

function walk(
  value: unknown,
  visitor: (key: string, val: unknown) => void,
  maxNodes = 5000
) {
  const stack: Array<{ key: string; value: unknown }> = [{ key: '', value }];
  let nodes = 0;
  while (stack.length > 0 && nodes < maxNodes) {
    const current = stack.pop();
    if (!current) break;
    nodes += 1;
    visitor(current.key, current.value);
    if (Array.isArray(current.value)) {
      for (const item of current.value) stack.push({ key: current.key, value: item });
      continue;
    }
    const rec = toRecord(current.value);
    if (!rec) continue;
    for (const [k, v] of Object.entries(rec)) stack.push({ key: k, value: v });
  }
}

function collectStringsForKey(value: unknown, keyPattern: RegExp, max = 20) {
  const out: string[] = [];
  walk(value, (key, val) => {
    if (out.length >= max) return;
    if (!keyPattern.test(key)) return;
    if (typeof val === 'string') {
      const clean = normalizeWhitespace(val);
      if (clean) out.push(clean);
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item !== 'string') continue;
        const clean = normalizeWhitespace(item);
        if (clean) out.push(clean);
        if (out.length >= max) break;
      }
    }
  });
  return Array.from(new Set(out));
}

function collectLatLng(value: unknown) {
  let lat: number | null = null;
  let lng: number | null = null;
  walk(value, (key, val) => {
    if (lat !== null && lng !== null) return;
    if (typeof val !== 'number') return;
    const lower = key.toLowerCase();
    if (lat === null && (lower === 'lat' || lower === 'latitude')) lat = val;
    if (
      lng === null &&
      (lower === 'lng' || lower === 'lon' || lower === 'long' || lower === 'longitude')
    ) {
      lng = val;
    }
  });
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function extractListingId(url: URL) {
  const roomId = url.pathname.match(/\/rooms\/(\d+)/i)?.[1];
  if (roomId) return roomId;
  const queryId = url.searchParams.get('listing_id');
  return queryId && /^\d+$/.test(queryId) ? queryId : null;
}

export function validateAirbnbListingUrl(rawUrl: string) {
  const input = normalizeWhitespace(rawUrl);
  if (!input) {
    return { ok: false as const, error: 'Please paste an Airbnb listing URL.' };
  }
  if (input.length > 600) {
    return { ok: false as const, error: 'Listing URL is too long.' };
  }

  let parsed: URL;
  try {
    const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    parsed = new URL(withScheme);
  } catch {
    return { ok: false as const, error: 'That does not look like a valid URL.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (!/(^|\.)airbnb\.(com|[a-z]{2}|com\.[a-z]{2})$/.test(host)) {
    return {
      ok: false as const,
      error: 'Please use a valid Airbnb listing URL.',
    };
  }

  if (!/\/rooms\/\d+/i.test(parsed.pathname) && !parsed.searchParams.get('listing_id')) {
    return {
      ok: false as const,
      error: 'This Airbnb URL does not look like a listing page.',
    };
  }

  parsed.hash = '';
  return {
    ok: true as const,
    url: parsed.href,
    listingId: extractListingId(parsed),
  };
}

export function parseAirbnbListingHtml(listingUrl: string, html: string): AirbnbExtractionResult {
  const scripts = parseJsonScriptBlocks(html);
  const primary = scripts[0] ?? null;
  const allSources = [primary, ...scripts].filter(Boolean) as unknown[];
  const combinedSource: unknown = allSources.length === 1 ? allSources[0] : allSources;

  const fromLdTitle = asCleanString(getNested(primary, ['name']));
  const fromOgTitle = extractMetaContent(html, 'property', 'og:title');
  const fromMetaTitle = extractMetaContent(html, 'name', 'title');
  const propertyName = fromLdTitle || fromOgTitle || fromMetaTitle;

  const hostFromAuthor = asCleanString(getNested(primary, ['author', 'name']));
  // Walk all JSON data for common host-name keys before falling back to HTML regex
  const hostFromJson = (() => {
    const candidates: string[] = [];
    walk(combinedSource, (key, val) => {
      if (candidates.length >= 5) return;
      const lower = key.toLowerCase();
      if (
        (lower === 'hostname' || lower === 'host_name' || lower === 'displayname' ||
         lower === 'display_name' || lower === 'firstname' || lower === 'first_name') &&
        typeof val === 'string'
      ) {
        const clean = normalizeWhitespace(val);
        if (clean && clean.length <= 60 && /^[\p{L}\p{M}'\-\s.]+$/u.test(clean)) {
          candidates.push(clean);
        }
      }
    });
    return candidates[0] ?? '';
  })();
  // Only accept HTML regex match if it looks like a real name (letters/spaces only, ≤40 chars)
  const rawHostFromRegex = firstMatch(html, /Hosted\s+by\s+([\p{L}\p{M}'\-\s.]{1,40})/iu);
  const hostFromRegex = rawHostFromRegex && /^[\p{L}\p{M}'\-\s.]+$/u.test(rawHostFromRegex)
    ? rawHostFromRegex.trim()
    : '';
  const hostName = hostFromAuthor || hostFromJson || hostFromRegex;

  const addrStreet = asCleanString(getNested(primary, ['address', 'streetAddress']));
  const addrCity = asCleanString(getNested(primary, ['address', 'addressLocality']));
  const addrState = asCleanString(getNested(primary, ['address', 'addressRegion']));
  const addrCountry = asCleanString(getNested(primary, ['address', 'addressCountry']));
  const locationName = [addrCity, addrState].filter(Boolean).join(', ');
  const fullAddress = [addrStreet, addrCity, addrState, addrCountry]
    .filter(Boolean)
    .join(', ');

  const latLng = collectLatLng(combinedSource);
  const googleMapsUrl = latLng
    ? `https://maps.google.com/?q=${latLng.lat},${latLng.lng}`
    : '';

  const parkingCandidates = [
    ...collectStringsForKey(combinedSource, /(parking|car|garage)/i, 8),
    firstMatch(html, /Parking[^<]{0,180}/i),
  ]
    .map((s) => normalizeWhitespace(s))
    .filter(Boolean);
  const parkingDetails = parkingCandidates[0] ?? '';

  const rules = collectStringsForKey(
    combinedSource,
    /(rule|house_rule|houseRules|not_allowed|allowed)/i,
    20
  )
    .filter((s) => s.length <= 200)
    .map((ruleText) => ({ ruleText, isDisplayed: true }))
    .slice(0, 8);

  const checkIns = collectStringsForKey(
    combinedSource,
    /(checkin|check_in|checkout|check_out|self_checkin)/i,
    10
  )
    .filter((s) => s.length <= 280)
    .map((instruction) => ({ instruction, isDisplayed: true }))
    .slice(0, 6);

  const listingValidation = validateAirbnbListingUrl(listingUrl);
  const normalizedUrl = listingValidation.ok ? listingValidation.url : listingUrl;
  const listingId = listingValidation.ok ? listingValidation.listingId : null;

  const prefill: AirbnbPrefill = {
    socialAirbnbUrl: normalizedUrl,
  };
  const suggestions: AirbnbSuggestion[] = [];
  const notes: string[] = [];

  if (propertyName) {
    prefill.propertyName = propertyName;
    suggestions.push({
      field: 'propertyName',
      confidence: fromLdTitle ? 'high' : 'medium',
      reason: fromLdTitle ? 'Found in listing metadata.' : 'Found in page title metadata.',
    });
  } else {
    notes.push('Could not confidently extract a listing title.');
  }

  if (hostName) {
    prefill.hostName = hostName;
    suggestions.push({
      field: 'hostName',
      confidence: hostFromAuthor ? 'high' : 'medium',
      reason: hostFromAuthor ? 'Found in listing metadata.' : 'Detected from listing text.',
    });
  } else {
    notes.push('Host name was not detected.');
  }

  if (locationName) {
    prefill.locationName = locationName;
    suggestions.push({
      field: 'locationName',
      confidence: 'medium',
      reason: 'Derived from listing address locality/region.',
    });
  }

  if (fullAddress) {
    prefill.fullAddress = fullAddress;
    suggestions.push({
      field: 'fullAddress',
      confidence: addrStreet ? 'medium' : 'low',
      reason: addrStreet
        ? 'Derived from address metadata.'
        : 'Listing location appears partial.',
    });
  } else {
    notes.push('Full address is usually hidden by Airbnb before booking.');
  }

  if (googleMapsUrl) {
    prefill.googleMapsUrl = googleMapsUrl;
    suggestions.push({
      field: 'googleMapsUrl',
      confidence: 'medium',
      reason: 'Built from listing latitude/longitude metadata.',
    });
  }

  if (parkingDetails) {
    prefill.parkingDetails = parkingDetails;
    suggestions.push({
      field: 'parkingDetails',
      confidence: 'low',
      reason: 'Detected from listing text/amenity hints.',
    });
  }

  if (rules.length > 0) {
    prefill.houseRules = rules;
    suggestions.push({
      field: 'houseRules',
      confidence: 'medium',
      reason: 'Extracted from listing rule-like text.',
    });
  }

  if (checkIns.length > 0) {
    prefill.checkInInstructions = checkIns;
    suggestions.push({
      field: 'checkInInstructions',
      confidence: 'medium',
      reason: 'Extracted from check-in/check-out text hints.',
    });
  }

  suggestions.push({
    field: 'socialAirbnbUrl',
    confidence: 'high',
    reason: 'Using the pasted Airbnb listing URL.',
  });

  if (!prefill.houseRules || prefill.houseRules.length === 0) {
    notes.push('House rules were not clearly available from public listing data.');
  }
  if (!prefill.checkInInstructions || prefill.checkInInstructions.length === 0) {
    notes.push('Check-in instructions may be limited on public Airbnb pages.');
  }
  notes.push('Review imported values before saving. Airbnb pages can vary by region and layout.');

  return {
    prefill,
    suggestions,
    notes,
    meta: {
      listingUrl: normalizedUrl,
      listingId,
      title: propertyName || null,
    },
  };
}

export async function extractAirbnbListingFromUrl(
  rawUrl: string,
  options?: {
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }
) {
  const validated = validateAirbnbListingUrl(rawUrl);
  if (!validated.ok) return validated;

  const timeoutMs = options?.timeoutMs ?? 12000;
  const fetchImpl = options?.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(validated.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ok: false as const,
        error:
          response.status === 404
            ? 'Airbnb listing was not found.'
            : 'Unable to fetch Airbnb listing right now.',
      };
    }

    const html = await response.text();
    if (!html || html.length < 400) {
      return {
        ok: false as const,
        error: 'Listing page content was empty or incomplete.',
      };
    }

    return {
      ok: true as const,
      result: parseAirbnbListingHtml(validated.url, html),
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return {
      ok: false as const,
      error: isAbort
        ? 'Airbnb import timed out. Please try again.'
        : 'Unable to import this Airbnb listing right now.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
