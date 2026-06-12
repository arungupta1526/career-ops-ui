/**
 * v1.69.1 — scan display cap regression guard.
 *
 * Both scanners store `filtered: filtered.slice(0, MAX_STORED_RESULTS)` in
 * data/last-scan.json (the set rendered in the #/scan table). It used to be a
 * hard `slice(0, 500)` per region, which silently truncated large regional
 * sweeps — a real RU scan produced 1352 matching jobs but only 500 were shown
 * (852 hidden). The cap is now a shared, env-overridable constant raised to
 * 2000. Adding to pipeline/history uses the uncapped `fresh` set and is
 * unaffected — only DISPLAY was capped.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_STORED_RESULTS } from '../server/lib/en-scanner.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('MAX_STORED_RESULTS default is 2000 and well above the old 500 cap', () => {
  assert.equal(typeof MAX_STORED_RESULTS, 'number');
  assert.equal(MAX_STORED_RESULTS, 2000, 'default display cap should be 2000');
  assert.ok(MAX_STORED_RESULTS > 500, 'must exceed the old hard 500 cap');
});

test('both scanners read the cap from the env-overridable constant', () => {
  // Source-level guard for the SCAN_MAX_RESULTS override without re-importing
  // paths.mjs (CI-isolation: PATHS resolves once per process).
  const src = readFileSync(resolve(ROOT, 'server', 'lib', 'en-scanner.mjs'), 'utf8');
  assert.match(src, /process\.env\.SCAN_MAX_RESULTS/, 'cap must be env-overridable via SCAN_MAX_RESULTS');
});

test('neither scanner still hard-codes slice(0, 500)', () => {
  for (const f of ['en-scanner.mjs', 'ru-scanner.mjs']) {
    const src = readFileSync(resolve(ROOT, 'server', 'lib', f), 'utf8');
    assert.doesNotMatch(src, /slice\(0,\s*500\)/, `${f} still has the hard 500 cap`);
    assert.match(src, /slice\(0,\s*MAX_STORED_RESULTS\)/, `${f} should cap via MAX_STORED_RESULTS`);
  }
});
