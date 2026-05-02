/**
 * Router config — sanity checks on the ALIASES table. Static guarantee
 * that future refactors don't silently regress FIX-C2 (#/profile alias).
 * The router itself is browser-only (touches `window`, `location.hash`,
 * etc.), so we read the file as text and grep.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTER_PATH = resolve(__dirname, '..', 'public', 'js', 'router.js');
const SRC = readFileSync(ROUTER_PATH, 'utf8');

test('router: ALIASES table maps profile → settings (FIX-C2)', () => {
  // Match the literal in the ALIASES object.
  assert.match(SRC, /ALIASES\s*=\s*\{[^}]*profile\s*:\s*['"]settings['"]/s);
});

test('router: nav highlight handles both alias name and resolved route', () => {
  // The nav-active toggle should compare against EITHER `name` or `rawName`,
  // otherwise #/profile would not light up the Profile sidebar item.
  assert.match(SRC, /classList\.toggle\(\s*['"]active['"]\s*,\s*r\s*===\s*name\s*\|\|\s*r\s*===\s*rawName/);
});
