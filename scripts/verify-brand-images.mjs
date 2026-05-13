#!/usr/bin/env node
/**
 * Ensures *.png under public/brand are real PNGs (not JPEG renamed .png).
 * Chat / tooling sometimes saves JPEG bytes with a .png filename — those cannot have transparency.
 *
 * Usage: node scripts/verify-brand-images.mjs
 * npm:  npm run verify:brand
 */

import fs from 'node:fs';
import path from 'node:path';

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);

const brandDir = path.join(process.cwd(), 'public', 'brand');
const files = fs.readdirSync(brandDir).filter((f) => f.endsWith('.png'));

let failed = false;
for (const name of files) {
  const full = path.join(brandDir, name);
  const buf = fs.readFileSync(full);
  const isPng = buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIG);
  const isJpeg = buf.length >= 3 && buf.subarray(0, 3).equals(JPEG_SIG);
  if (!isPng) {
    failed = true;
    const kind = isJpeg ? 'JPEG data (wrong extension — replace with a real PNG export)' : 'unknown binary';
    console.error(`FAIL  ${name}  →  ${kind}`);
  } else {
    // IHDR byte 25 (0-based): color type — 6 = RGBA, 4 = gray+alpha
    const colorType = buf.length > 25 ? buf[25] : 0;
    const hasAlpha = colorType === 6 || colorType === 4;
    const alphaNote = hasAlpha ? 'RGBA/grayscale+α' : 'RGB/grayscale (no alpha)';
    console.log(`OK    ${name}  →  PNG, ${alphaNote}`);
  }
}

if (failed) {
  console.error(
    '\nFix: copy your real PNG from Finder (or `cp /path/to/logo.png public/brand/<name>.png`).\n' +
      'Avoid pasting only into chat if the file arrives re-encoded.\n'
  );
  process.exit(1);
}
