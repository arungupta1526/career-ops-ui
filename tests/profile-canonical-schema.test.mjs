/**
 * G-009 (v1.15.0) — `/api/profile` now accepts BOTH the legacy schema
 * (candidate:{full_name,email,linkedin}, target:{roles,comp_total_min_usd})
 * AND the canonical career-ops.org schema (top-level full_name/email/location,
 * target_roles.primary, compensation.target_range, narrative.headline).
 * Legacy fields win when both shapes are present so existing YAML continues
 * to render identically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createApp } from '../server/index.mjs';

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'profile-canonical-'));
  process.env.CAREER_OPS_ROOT = root;
  mkdirSync(join(root, 'config'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(join(root, 'cv.md'), '# CV\n');
  writeFileSync(join(root, 'data', 'applications.md'), '# Applications\n');
  return root;
}

async function startApp() {
  const root = makeFixture();
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => server.close(),
    root,
  };
}

test('canonical schema: top-level full_name + location + narrative.headline summarized', async () => {
  const { base, close, root } = await startApp();
  try {
    const yaml = [
      'full_name: Alice Canonical',
      'email: alice@example.com',
      'location: Lisbon',
      'narrative:',
      '  headline: "Backend engineer who ships."',
      'target_roles:',
      '  primary:',
      '    - "Senior Backend Engineer"',
      '    - "Staff Engineer"',
      'compensation:',
      '  target_range: "$120K-160K"',
    ].join('\n');
    const r = await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml }),
    });
    assert.equal(r.status, 200);
    const get = await (await fetch(base + '/api/profile')).json();
    assert.equal(get.summary.full_name, 'Alice Canonical');
    assert.equal(get.summary.location, 'Lisbon');
    assert.equal(get.summary.headline, 'Backend engineer who ships.');
    assert.deepEqual(get.summary.target_roles, ['Senior Backend Engineer', 'Staff Engineer']);
    assert.equal(get.summary.comp_min_usd, 120000);
  } finally { close(); }
});

test('legacy schema: candidate.{full_name,location} + target.{roles,comp_total_min_usd} still works', async () => {
  const { base, close } = await startApp();
  try {
    const yaml = [
      'candidate:',
      '  full_name: Bob Legacy',
      '  email: bob@example.com',
      '  location: Berlin',
      '  linkedin: https://linkedin.com/in/bob',
      'target:',
      '  roles:',
      '    - "Senior Backend"',
      '  comp_total_min_usd: 100000',
      '  archetypes:',
      '    - { name: "Platform engineer", fit: "high", level: "senior" }',
    ].join('\n');
    const r = await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml }),
    });
    assert.equal(r.status, 200);
    const get = await (await fetch(base + '/api/profile')).json();
    assert.equal(get.summary.full_name, 'Bob Legacy');
    assert.equal(get.summary.location, 'Berlin');
    assert.equal(get.summary.headline, null);
    assert.deepEqual(get.summary.target_roles, ['Senior Backend']);
    assert.equal(get.summary.comp_min_usd, 100000);
    assert.equal(get.summary.archetypes.length, 1);
  } finally { close(); }
});

test('mixed schema: legacy wins when both shapes are present', async () => {
  const { base, close } = await startApp();
  try {
    const yaml = [
      'full_name: Should Lose',
      'location: Should Lose City',
      'candidate:',
      '  full_name: Should Win',
      '  location: Winning City',
      'target:',
      '  roles: ["Legacy Role"]',
      'target_roles:',
      '  primary: ["Canonical Role"]',
    ].join('\n');
    const r = await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml }),
    });
    assert.equal(r.status, 200);
    const get = await (await fetch(base + '/api/profile')).json();
    assert.equal(get.summary.full_name, 'Should Win');
    assert.equal(get.summary.location, 'Winning City');
    assert.deepEqual(get.summary.target_roles, ['Legacy Role']);
  } finally { close(); }
});

test('validation: accepts canonical-only profile (no candidate: block)', async () => {
  const { base, close } = await startApp();
  try {
    const r = await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml: 'full_name: Alice Canonical\nemail: a@b.com\n' }),
    });
    assert.equal(r.status, 200);
  } finally { close(); }
});

test('validation: rejects YAML with neither candidate: nor top-level full_name:', async () => {
  const { base, close } = await startApp();
  try {
    const r = await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml: 'target:\n  roles: ["X"]\n' }),
    });
    assert.equal(r.status, 400);
    const body = await r.json();
    assert.match(body.error, /full_name/);
  } finally { close(); }
});

test('compensation: parses "$120K-160K" → min 120000', async () => {
  const { base, close } = await startApp();
  try {
    const yaml = 'full_name: Alice\ncompensation:\n  target_range: "$120K-160K"\n';
    await fetch(base + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml }),
    });
    const get = await (await fetch(base + '/api/profile')).json();
    assert.equal(get.summary.comp_min_usd, 120000);
  } finally { close(); }
});
