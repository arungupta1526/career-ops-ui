/**
 * RU portal scanner — orchestrates hh.ru + Habr Career.
 *
 * Reads search keywords + filters from portals.yml (or sensible defaults).
 * Filters by negative keywords. Dedups against data/scan-history.tsv.
 * Appends new URLs to data/pipeline.md and the scan-history TSV.
 *
 * Designed to be invoked from /api/stream/scan-ru and stream live progress
 * via an `onLog(stream, line)` callback.
 */
import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { PATHS } from './paths.mjs';
import { searchHH } from './sources/hh.mjs';
import { searchHabr } from './sources/habr.mjs';
import { addPipelineUrl } from './parsers.mjs';
import { saveLastScan } from './en-scanner.mjs';

/**
 * Default Russian-language search queries — used when portals.yml lacks a
 * russian_portals.queries section. Picked from typical hh.ru naming.
 */
const DEFAULT_QUERIES = [
  'Senior PHP',
  'PHP Symfony',
  'PHP Laravel',
  'Senior Go',
  'Golang Backend',
  'Backend Senior',
  'Tech Lead PHP',
  'Tech Lead Go',
];

const DEFAULT_NEGATIVE = [
  'junior', 'стажёр', 'стажер', 'младший', 'intern',
  'java', 'kotlin', 'scala', 'ruby', 'rails',
  'python', 'node.js',
  'ios', 'android', 'mobile',
  'frontend',
];

export function loadConfig() {
  let portals = {};
  if (existsSync(PATHS.portals)) {
    try {
      portals = yaml.load(readFileSync(PATHS.portals, 'utf8')) || {};
    } catch {}
  }
  const ru = portals.russian_portals || {};
  const titleFilter = portals.title_filter || {};

  return {
    queries: ru.queries || DEFAULT_QUERIES,
    negative: (titleFilter.negative || DEFAULT_NEGATIVE).map((s) => s.toLowerCase()),
    sources: ru.sources || ['hh', 'habr'],
    area: ru.area ?? 113, // Russia
    perPage: ru.per_page ?? 50,
    onlyRemote: ru.only_remote ?? false,
  };
}

/**
 * Read every URL ever seen (across data/scan-history.tsv AND
 * data/pipeline.md AND data/applications.md) so we never re-add a known one.
 */
export function loadSeenUrls() {
  const seen = new Set();
  const tryRead = (p) => {
    try {
      return readFileSync(p, 'utf8');
    } catch {
      return '';
    }
  };
  // scan-history.tsv: columns include the URL — match http(s)
  const scanHist = tryRead(PATHS.scanHistory);
  for (const m of scanHist.matchAll(/https?:\/\/\S+/g)) seen.add(m[0]);
  // pipeline.md
  const pipeline = tryRead(PATHS.pipeline);
  for (const m of pipeline.matchAll(/https?:\/\/\S+/g)) seen.add(m[0]);
  // applications.md (already-tracked offers)
  const apps = tryRead(PATHS.applications);
  for (const m of apps.matchAll(/https?:\/\/\S+/g)) seen.add(m[0]);
  return seen;
}

function passesNegative(title, negativeKeywords) {
  const t = (title || '').toLowerCase();
  return !negativeKeywords.some((n) => t.includes(n));
}

/**
 * Run a full RU scan. Calls onLog(stream, line) for each progress line.
 *
 * Options:
 *   writeFiles  — when true (default), append findings to pipeline.md +
 *                 scan-history.tsv. When false, do everything in-memory only
 *                 (used by tests + dry-run mode).
 *   onLog       — function(stream:'stdout'|'stderr', line:string)
 *   fetchImpl   — override for tests (default: global fetch)
 */
export async function runRuScan(opts = {}) {
  const { writeFiles = true, onLog = () => {}, fetchImpl } = opts;
  const cfg = loadConfig();
  const seen = loadSeenUrls();

  const log = (s, line) => onLog(s, line);
  log('stdout', '━'.repeat(60));
  log('stdout', `RU Portal Scan — ${new Date().toISOString().slice(0, 10)}`);
  log('stdout', '━'.repeat(60));
  log('stdout', `Sources: ${cfg.sources.join(', ')}`);
  log('stdout', `Queries: ${cfg.queries.length}`);
  log('stdout', `Negatives: ${cfg.negative.length}`);
  log('stdout', `Already seen: ${seen.size} URLs`);
  log('stdout', '');

  const allFound = [];
  const errors = [];
  // Track repeated source-level failures (e.g., 10x hh.ru 403) — show once.
  const sourceFailures = {};
  let hhDisabled = false;

  for (const q of cfg.queries) {
    log('stdout', `▸ "${q}"`);
    const results = await runQuery(q, cfg, fetchImpl, errors, sourceFailures, hhDisabled, log);
    log('stdout', `  → ${results.length} hits`);
    allFound.push(...results);
    // First hh.ru 403 → disable for rest of run + log once
    if (sourceFailures.hh?.geoBlocked && !hhDisabled) {
      hhDisabled = true;
      log('stderr', '  ⚠ hh.ru disabled for this run (HTTP 403 — geo-blocked)');
      log('stderr', '    set HH_USER_AGENT in .env or run from a Russian IP');
    }
  }

  // Dedup within this batch
  const uniq = new Map();
  for (const j of allFound) uniq.set(j.url, j);
  const flat = [...uniq.values()];

  const filtered = flat.filter((j) => passesNegative(j.title, cfg.negative));
  const removedNeg = flat.length - filtered.length;
  const fresh = filtered.filter((j) => !seen.has(j.url));
  const dup = filtered.length - fresh.length;

  log('stdout', '');
  log('stdout', '━'.repeat(60));
  log('stdout', `Total found:           ${flat.length}`);
  log('stdout', `Filtered by negative:  ${removedNeg} removed`);
  log('stdout', `Already-seen dedup:    ${dup} skipped`);
  log('stdout', `New offers added:      ${fresh.length}`);
  log('stdout', '━'.repeat(60));

  if (writeFiles) {
    if (fresh.length) {
      appendToPipeline(fresh);
      appendToHistory(fresh);
      log('stdout', `→ Appended ${fresh.length} URLs to data/pipeline.md`);
    }
    saveLastScan({
      kind: 'ru',
      when: new Date().toISOString(),
      fresh,
      filtered: filtered.slice(0, 500),
      errors,
    });
  }

  // One concise summary line per failed source (instead of N repeats)
  if (Object.keys(sourceFailures).length) {
    log('stderr', '');
    for (const [src, info] of Object.entries(sourceFailures)) {
      log('stderr', `  ⚠ ${src}: ${info.count} queries failed (${info.firstMessage})`);
    }
  }

  return {
    cfg,
    counts: { raw: flat.length, removedNeg, dup, fresh: fresh.length },
    fresh,
    errors,
  };
}

async function runQuery(query, cfg, fetchImpl, errors, sourceFailures, hhDisabled, log) {
  const out = [];
  if (cfg.sources.includes('hh') && !hhDisabled) {
    try {
      const items = await searchHH(query, {
        area: cfg.area,
        perPage: cfg.perPage,
        onlyRemote: cfg.onlyRemote,
        fetchImpl,
      });
      out.push(...items);
      log('stdout', `    hh.ru:  ${items.length}`);
    } catch (e) {
      // Track in sourceFailures for one-line summary
      sourceFailures.hh = sourceFailures.hh || { count: 0, firstMessage: e.message, geoBlocked: e.geoBlocked };
      sourceFailures.hh.count += 1;
      errors.push(`hh.ru "${query}": ${e.message}`);
      // Suppress per-query log spam — one summary handled in caller
    }
  }
  if (cfg.sources.includes('habr')) {
    try {
      const items = await searchHabr(query, {
        onlyRemote: cfg.onlyRemote,
        fetchImpl,
      });
      out.push(...items);
      log('stdout', `    habr:   ${items.length}`);
    } catch (e) {
      sourceFailures.habr = sourceFailures.habr || { count: 0, firstMessage: e.message };
      sourceFailures.habr.count += 1;
      errors.push(`Habr "${query}": ${e.message}`);
    }
  }
  return out;
}

function appendToPipeline(jobs) {
  let content = '';
  try {
    content = readFileSync(PATHS.pipeline, 'utf8');
  } catch {}
  let updated = content;
  for (const j of jobs) updated = addPipelineUrl(updated, j.url);
  mkdirSync(PATHS.pipeline.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(PATHS.pipeline, updated);
}

function appendToHistory(jobs) {
  mkdirSync(PATHS.scanHistory.replace(/\/[^/]+$/, ''), { recursive: true });
  const lines = jobs.map((j) =>
    [
      new Date().toISOString().slice(0, 10),
      j.source,
      j.id,
      j.company,
      j.title,
      j.url,
    ]
      .map((x) => String(x ?? '').replace(/\t/g, ' '))
      .join('\t')
  );
  appendFileSync(PATHS.scanHistory, lines.join('\n') + '\n');
}
