import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseAirbnbListingHtml,
  validateAirbnbListingUrl,
} from '@/lib/airbnb/extract-listing';

test('validateAirbnbListingUrl accepts canonical listing URL', () => {
  const out = validateAirbnbListingUrl('https://www.airbnb.com/rooms/12345678');
  assert.equal(out.ok, true);
  if (out.ok) {
    assert.equal(out.listingId, '12345678');
  }
});

test('validateAirbnbListingUrl rejects non-airbnb URL', () => {
  const out = validateAirbnbListingUrl('https://example.com/rooms/123');
  assert.equal(out.ok, false);
});

test('parseAirbnbListingHtml maps basic metadata into prefill', () => {
  const html = `
    <html>
      <head>
        <meta property="og:title" content="Ocean Breeze Loft - Airbnb" />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": "Ocean Breeze Loft",
            "author": { "name": "Maya" },
            "address": {
              "streetAddress": "123 Coastline Ave",
              "addressLocality": "Miami",
              "addressRegion": "Florida",
              "addressCountry": "US"
            },
            "geo": { "latitude": 25.7617, "longitude": -80.1918 }
          }
        </script>
      </head>
      <body>
        <div>House rules</div>
      </body>
    </html>
  `;
  const out = parseAirbnbListingHtml('https://www.airbnb.com/rooms/12345678', html);
  assert.equal(out.prefill.propertyName, 'Ocean Breeze Loft');
  assert.equal(out.prefill.hostName, 'Maya');
  assert.equal(out.prefill.locationName, 'Miami, Florida');
  assert.ok(out.prefill.googleMapsUrl?.includes('maps.google.com'));
  assert.equal(out.prefill.socialAirbnbUrl, 'https://www.airbnb.com/rooms/12345678');
});
