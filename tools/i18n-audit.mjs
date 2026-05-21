#!/usr/bin/env node
/**
 * i18n dictionary hygiene audit (I18N-CL4, v1.59.12).
 *
 * Loads public/js/lib/i18n-dict.js (a classic script that assigns
 * `window.__I18N_DICT`) inside a vm sandbox and runs hygiene checks.
 *
 * The dict shape is KEY-keyed:
 *     'some.key': { en: '…', es: '…', 'pt-BR': '…', ru, ja, ko, 'zh-CN', 'zh-TW' }
 *
 * HARD failures (exit 1) — block a ship:
 *   1. Personal-data leak (maintainer cert / email / LinkedIn)
 *   2. Locale parity gap (a key missing one of the 8 locales)
 *   3. Empty value in any locale
 *   4. Hardcoded calendar date literal (e.g. 2026-04-21) — these rot;
 *      a format hint like YYYY-MM-DD / AAAA-MM-DD / ГГГГ-ММ-ДД is fine.
 *
 * WARNINGS (exit 0) — informational, do NOT block:
 *   5. Duplicate values within a locale. In THIS codebase most dupes
 *      are intentional: `nav.scan` (sidebar) vs `scan.btnRun` (button)
 *      vs `scan.col.company` (table header) share an English word but
 *      are distinct UI roles that non-English locales frequently need
 *      to translate differently. Forcing a single canonical key would
 *      remove that flexibility (see I18N-CL3 decision in the v1.59.12
 *      CHANGELOG). So we REPORT dupes but never fail on them.
 *   6. Trailing/leading whitespace — several keys legitimately end with
 *      ": " (e.g. `config.profileLoadErr`), so this is a warning.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DICT_PATH = resolve(__dirname, '..', 'public', 'js', 'lib', 'i18n-dict.js');

const LOCALES = ['en', 'es', 'pt-BR', 'ru', 'ja', 'ko', 'zh-CN', 'zh-TW'];

const PERSONAL = [
  /AWS\s+Solutions\s+Architect/i,
  /Azure\s+(?:Architect|Developer|Engineer)\s+Associate/i,
  /[a-z0-9._%+-]+@(?:gmail|yandex|mail|outlook|proton|protonmail|hotmail)\.[a-z]{2,}/i,
  /linkedin\.com\/in\/[\w-]+/i,
];

// A bare calendar date that IS the whole value (a placeholder that
// rots — the I18N-CL2 defect). We anchor on the full trimmed string so
// a date used as an *example inside* explanatory copy — e.g.
// `followup.lastErr` = "…ISO date: YYYY-MM-DD (e.g. 2026-05-19)." — is
// NOT flagged. Those inline examples are good UX, not rot. Format
// hints (YYYY-MM-DD / AAAA-MM-DD / ГГГГ-ММ-ДД) never match this.
const BARE_CALENDAR_DATE = /^\s*(?:19|20)\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\s*$/;

function loadDict() {
  const src = readFileSync(DICT_PATH, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'i18n-dict.js' });
  return sandbox.window.__I18N_DICT;
}

function main() {
  const dict = loadDict();
  const keys = Object.keys(dict);
  const hardFailures = [];
  const warnings = [];

  // 1. Personal data
  for (const key of keys) {
    for (const loc of LOCALES) {
      const v = dict[key]?.[loc];
      if (typeof v !== 'string') continue;
      for (const re of PERSONAL) {
        if (re.test(v)) hardFailures.push(`[personal-data] ${key}[${loc}] = "${v}"`);
      }
    }
  }

  // 2. Parity + 3. empty values
  for (const key of keys) {
    const row = dict[key] || {};
    for (const loc of LOCALES) {
      if (!(loc in row)) {
        hardFailures.push(`[parity] ${key} missing locale "${loc}"`);
      } else if (typeof row[loc] !== 'string' || row[loc].length === 0) {
        hardFailures.push(`[empty] ${key}[${loc}] is empty`);
      }
    }
  }

  // 4. Hardcoded calendar dates
  for (const key of keys) {
    for (const loc of LOCALES) {
      const v = dict[key]?.[loc];
      if (typeof v === 'string' && BARE_CALENDAR_DATE.test(v)) {
        hardFailures.push(`[hardcoded-date] ${key}[${loc}] = "${v}" — a bare date placeholder rots; use a format hint`);
      }
    }
  }

  // 5. Duplicate values per locale (WARNING only)
  for (const loc of LOCALES) {
    const v2k = {};
    for (const key of keys) {
      const v = dict[key]?.[loc];
      if (typeof v !== 'string' || v.length < 3) continue;
      (v2k[v] ??= []).push(key);
    }
    const dupes = Object.entries(v2k).filter(([, ks]) => ks.length > 1);
    if (dupes.length) warnings.push(`[dupes] ${loc}: ${dupes.length} duplicate-value groups (intentional — distinct UI roles; see I18N-CL3)`);
  }

  // 6. Whitespace (WARNING only — some keys end with ": " by design)
  for (const key of keys) {
    for (const loc of LOCALES) {
      const v = dict[key]?.[loc];
      if (typeof v === 'string' && v !== v.trim() && !v.endsWith(': ') && !v.endsWith('— ')) {
        warnings.push(`[whitespace] ${key}[${loc}] = "${v}"`);
      }
    }
  }

  console.log(`\n=== i18n audit · ${keys.length} keys × ${LOCALES.length} locales ===`);
  console.log(`hard failures: ${hardFailures.length} · warnings: ${warnings.length}\n`);
  if (warnings.length) {
    console.log('WARNINGS (informational, non-blocking):');
    warnings.forEach((w) => console.log('  ' + w));
    console.log('');
  }
  if (hardFailures.length) {
    console.log('HARD FAILURES (block the ship):');
    hardFailures.forEach((f) => console.log('  ' + f));
    console.log('');
    process.exit(1);
  }
  console.log('✓ no hard failures — dictionary is clean');
  process.exit(0);
}

main();
