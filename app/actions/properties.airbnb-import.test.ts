import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAirbnbImportInput } from '@/lib/airbnb/import-input';

test('validateAirbnbImportInput rejects empty input', () => {
  const out = validateAirbnbImportInput('   ');
  assert.equal(out.ok, false);
});

test('validateAirbnbImportInput rejects excessively long input', () => {
  const out = validateAirbnbImportInput(`https://airbnb.com/rooms/${'1'.repeat(700)}`);
  assert.equal(out.ok, false);
});

test('validateAirbnbImportInput accepts normal input', () => {
  const out = validateAirbnbImportInput('https://www.airbnb.com/rooms/123456');
  assert.equal(out.ok, true);
});
