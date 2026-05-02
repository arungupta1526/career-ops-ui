import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMarkdownTable,
  parseApplications,
  parsePipeline,
  addPipelineUrl,
  removePipelineUrl,
  parseReportHeader,
  slugify,
  today,
} from '../server/lib/parsers.mjs';

// ───────────────────────── parseMarkdownTable ─────────────────────────

test('parseMarkdownTable: empty input', () => {
  assert.deepEqual(parseMarkdownTable(''), { headers: [], rows: [] });
  assert.deepEqual(parseMarkdownTable(null), { headers: [], rows: [] });
});

test('parseMarkdownTable: simple table', () => {
  const md = `
intro line

| A | B | C |
|---|---|---|
| 1 | 2 | 3 |
| 4 | 5 | 6 |

after
`;
  const { headers, rows } = parseMarkdownTable(md);
  assert.deepEqual(headers, ['A', 'B', 'C']);
  assert.deepEqual(rows, [['1', '2', '3'], ['4', '5', '6']]);
});

test('parseMarkdownTable: stops at first blank line after table', () => {
  const md = `| H |
|---|
| x |

| H2 |
|----|
| y  |`;
  const { rows } = parseMarkdownTable(md);
  assert.deepEqual(rows, [['x']]);
});

test('parseMarkdownTable: rejects fake tables (no separator)', () => {
  const md = `| A | B |\n| 1 | 2 |\n`;
  assert.deepEqual(parseMarkdownTable(md), { headers: [], rows: [] });
});

// ───────────────────────── parseApplications ─────────────────────────

test('parseApplications: real-world tracker row', () => {
  const md = `# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-05-02 | Wheely | Senior Backend | 4.2/5 | Evaluated | ✅ | [001](reports/001-wheely-2026-05-02.md) | Strong Go fit |
`;
  const apps = parseApplications(md);
  assert.equal(apps.length, 1);
  const a = apps[0];
  assert.equal(a.num, '1');
  assert.equal(a.company, 'Wheely');
  assert.equal(a.score, '4.2/5');
  assert.equal(a.scoreNum, 4.2);
  assert.equal(a.status, 'Evaluated');
  assert.equal(a.pdfReady, true);
  assert.equal(a.reportPath, 'reports/001-wheely-2026-05-02.md');
});

test('parseApplications: handles missing pdf and report', () => {
  const md = `| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-01-01 | Acme | Eng | 3.0/5 | Applied | ❌ | — | n/a |`;
  const a = parseApplications(md)[0];
  assert.equal(a.pdfReady, false);
  assert.equal(a.reportPath, null);
});

test('parseApplications: empty tracker', () => {
  assert.deepEqual(parseApplications(''), []);
  assert.deepEqual(parseApplications('# Tracker\n\nNo data'), []);
});

// ───────────────────────── parsePipeline ─────────────────────────

test('parsePipeline: empty', () => {
  assert.deepEqual(parsePipeline(''), []);
  assert.deepEqual(parsePipeline('# Pipeline\n\nDrop URLs:\n\n```\n```\n'), []);
});

test('parsePipeline: extracts urls from fence', () => {
  const md = '# Pipeline\n```\nhttps://a.com/job/1\nhttps://b.com/job/2\nlocal:jds/x.txt\n```';
  assert.deepEqual(parsePipeline(md), [
    'https://a.com/job/1',
    'https://b.com/job/2',
    'local:jds/x.txt',
  ]);
});

test('parsePipeline: ignores non-URL lines in fence', () => {
  const md = '```\n# comment\nhttps://x.com/1\n\nsome note\n```';
  assert.deepEqual(parsePipeline(md), ['https://x.com/1']);
});

// ───────────────────────── addPipelineUrl ─────────────────────────

test('addPipelineUrl: adds new url', () => {
  const before = '# Pipeline\n\n```\nhttps://a.com/1\n```\n';
  const after = addPipelineUrl(before, 'https://b.com/2');
  assert.deepEqual(parsePipeline(after), ['https://a.com/1', 'https://b.com/2']);
});

test('addPipelineUrl: dedup', () => {
  const before = '```\nhttps://a.com/1\n```';
  const after = addPipelineUrl(before, 'https://a.com/1');
  assert.equal(after, before);
});

test('addPipelineUrl: creates fence when missing', () => {
  const after = addPipelineUrl('', 'https://x.com/1');
  assert.deepEqual(parsePipeline(after), ['https://x.com/1']);
  assert.match(after, /```[\s\S]*```/);
});

test('removePipelineUrl: removes url', () => {
  const before = '```\nhttps://a.com/1\nhttps://b.com/2\n```';
  const after = removePipelineUrl(before, 'https://a.com/1');
  assert.deepEqual(parsePipeline(after), ['https://b.com/2']);
});

// ───────────────────────── parseReportHeader ─────────────────────────

test('parseReportHeader: full header', () => {
  const md = `# Evaluation: Wheely — Senior Backend

**Date:** 2026-05-02
**Archetype:** Senior Go Backend
**Score:** 4.2/5
**URL:** https://example.com/job/1
**Legitimacy:** High Confidence
**PDF:** pending

---

## A) Role Summary
content
`;
  const h = parseReportHeader(md);
  assert.equal(h.title, 'Evaluation: Wheely — Senior Backend');
  assert.equal(h.date, '2026-05-02');
  assert.equal(h.score, '4.2/5');
  assert.equal(h.scoreNum, 4.2);
  assert.equal(h.url, 'https://example.com/job/1');
  assert.equal(h.legitimacy, 'High Confidence');
});

test('parseReportHeader: missing fields → empty strings', () => {
  const h = parseReportHeader('# Hello');
  assert.equal(h.title, 'Hello');
  assert.equal(h.score, '');
  assert.equal(h.scoreNum, null);
});

// ───────────────────────── slugify / today ─────────────────────────

test('slugify', () => {
  assert.equal(slugify('Hello World!'), 'hello-world');
  assert.equal(slugify('  Multiple   spaces  '), 'multiple-spaces');
  assert.equal(slugify('Wheely (Cyprus)'), 'wheely-cyprus');
  assert.equal(slugify(''), '');
  assert.equal(slugify(null), '');
});

test('today: YYYY-MM-DD format', () => {
  const t = today();
  assert.match(t, /^\d{4}-\d{2}-\d{2}$/);
});
