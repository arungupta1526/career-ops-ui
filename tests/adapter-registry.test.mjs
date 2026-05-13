/**
 * v1.13.0 — adapter registry. Smoke test for the resolver: each known
 * ATS detects from `careers_url`, builds the right endpoint, and the
 * existing `detectApi()` keeps returning the same shape it always did.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveAdapter, ALL_ADAPTERS } from '../server/lib/portals/registry.mjs';

test('registry: every adapter has the required contract', () => {
  for (const a of ALL_ADAPTERS) {
    assert.ok(a.id, 'adapter must have id');
    assert.ok(a.label, 'adapter must have label');
    assert.equal(typeof a.matches, 'function', `${a.id}.matches must be a function`);
    assert.equal(typeof a.buildEndpoint, 'function', `${a.id}.buildEndpoint must be a function`);
    assert.equal(typeof a.fetch, 'function', `${a.id}.fetch must be a function`);
  }
});

test('registry: resolveAdapter matches Greenhouse via careers_url', () => {
  const m = resolveAdapter({ name: 'Anthropic', careers_url: 'https://job-boards.greenhouse.io/anthropic' });
  assert.ok(m);
  assert.equal(m.adapter.id, 'greenhouse');
  assert.equal(m.endpoint, 'https://boards-api.greenhouse.io/v1/boards/anthropic/jobs');
});

test('registry: resolveAdapter matches Ashby via careers_url + adds compensation flag', () => {
  const m = resolveAdapter({ name: 'Linear', careers_url: 'https://jobs.ashbyhq.com/linear' });
  assert.ok(m);
  assert.equal(m.adapter.id, 'ashby');
  assert.match(m.endpoint, /api\.ashbyhq\.com\/posting-api\/job-board\/linear\?includeCompensation=true/);
});

test('registry: resolveAdapter matches Lever via careers_url', () => {
  const m = resolveAdapter({ name: 'JetBrains', careers_url: 'https://jobs.lever.co/jetbrains' });
  assert.ok(m);
  assert.equal(m.adapter.id, 'lever');
  assert.equal(m.endpoint, 'https://api.lever.co/v0/postings/jetbrains');
});

test('registry: resolveAdapter prefers explicit `api:` field over URL detection', () => {
  const m = resolveAdapter({
    name: 'Stripe',
    careers_url: 'https://stripe.com/jobs',
    api: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs',
  });
  assert.equal(m.adapter.id, 'greenhouse');
  assert.equal(m.endpoint, 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs');
});

test('registry: resolveAdapter returns null when no adapter matches', () => {
  const m = resolveAdapter({ name: 'CustomCo', careers_url: 'https://customco.example.com/careers' });
  assert.equal(m, null);
});

test('registry: detectApi (legacy shape) still returns { type, url }', async () => {
  const { detectApi } = await import('../server/lib/en-scanner.mjs');
  const d = detectApi({ name: 'Anthropic', careers_url: 'https://job-boards.greenhouse.io/anthropic' });
  assert.deepEqual(d, {
    type: 'greenhouse',
    url: 'https://boards-api.greenhouse.io/v1/boards/anthropic/jobs',
  });
});
