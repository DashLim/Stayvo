import assert from 'node:assert/strict';
import test from 'node:test';
import { safeNextPath } from './auth-callback-url';

test('safeNextPath accepts root-relative internal destinations', () => {
  assert.equal(safeNextPath('/'), '/');
  assert.equal(safeNextPath('/dashboard'), '/dashboard');
  assert.equal(safeNextPath('/dashboard?tab=track#links'), '/dashboard?tab=track#links');
  assert.equal(safeNextPath('/properties/new?name=Sea%20View'), '/properties/new?name=Sea%20View');
});

test('safeNextPath rejects external and protocol-relative destinations', () => {
  for (const value of [
    null,
    '',
    'https://evil.example/path',
    '//evil.example/path',
    '///evil.example/path',
    '/\\evil.example/path',
    '/%5cevil.example/path',
    '/%2f%2fevil.example/path',
    '/%252f%252fevil.example/path',
    '/%255c%255cevil.example/path',
    '/\u0000evil',
    '/bad%encoding',
  ]) {
    assert.equal(safeNextPath(value), '/dashboard', `expected fallback for ${String(value)}`);
  }
});
