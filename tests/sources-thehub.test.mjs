/**
 * The Hub source — CI-isolated tests.
 * Uses a fake fetchImpl (no network, no parent-project dependency).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchTheHub, assertTheHubUrl, FEED_BASE } from '../server/lib/sources/thehub.mjs';
import { thehubAdapter } from '../server/lib/portals/adapters/thehub.mjs';

// ---------------------------------------------------------------------------
// Fake response helpers
// ---------------------------------------------------------------------------

function makeJob(overrides = {}) {
  return {
    id: 42,
    title: 'Senior Engineer',
    company: { name: 'Acme Nordic' },
    absoluteJobUrl: 'https://thehub.io/jobs/acme-senior-engineer',
    isRemote: true,
    location: { address: 'Copenhagen', locality: 'Copenhagen', country: 'Denmark' },
    publishedAt: '2026-06-01T10:00:00.000Z',
    createdAt: '2026-05-30T08:00:00.000Z',
    ...overrides,
  };
}

function makePage(docs, pages = 1, page = 1) {
  return { docs, pages, page, total: docs.length, limit: 15 };
}

function fakeFetch(pages) {
  // pages: array of response bodies (one per page requested)
  let call = 0;
  return async (_url, _opts) => {
    const body = pages[call] ?? pages[pages.length - 1];
    call++;
    return {
      ok: true,
      json: async () => body,
    };
  };
}

// ---------------------------------------------------------------------------
// fetchTheHub — happy path: single page, two valid jobs + one bad-host dropped
// ---------------------------------------------------------------------------

test('fetchTheHub: normalizes jobs, drops bad-host URL', async () => {
  const goodJob = makeJob();
  const badHostJob = makeJob({
    id: 99,
    title: 'Off-Host Role',
    absoluteJobUrl: 'https://evil.com/job/123', // must be dropped
  });
  const noTitleJob = makeJob({ id: 100, title: '' }); // dropped — no title

  const fetchImpl = fakeFetch([makePage([goodJob, badHostJob, noTitleJob], 1)]);
  const jobs = await fetchTheHub(FEED_BASE, { fetchImpl });

  assert.equal(jobs.length, 1, 'only the good-host job survives');
  const j = jobs[0];

  // 12-field shape
  assert.equal(j.id, 'thehub-42');
  assert.equal(j.title, 'Senior Engineer');
  assert.equal(j.company, 'Acme Nordic');
  assert.equal(j.url, 'https://thehub.io/jobs/acme-senior-engineer');
  assert.equal(j.salary, '');
  assert.equal(j.isRemote, true);
  assert.equal(j.workplaceType, 'Remote');
  assert.equal(j.relocates, false);
  assert.equal(j.date, '2026-06-01'); // from publishedAt
  assert.equal(j.snippet, '');
  assert.equal(j.source, 'thehub');
  assert.ok(typeof j.location === 'string');
});

// ---------------------------------------------------------------------------
// normalize: date fallback — uses createdAt when publishedAt is absent
// ---------------------------------------------------------------------------

test('fetchTheHub: falls back to createdAt when publishedAt missing', async () => {
  const job = makeJob({ publishedAt: undefined, createdAt: '2026-05-30T08:00:00.000Z' });
  const fetchImpl = fakeFetch([makePage([job])]);
  const jobs = await fetchTheHub(FEED_BASE, { fetchImpl });
  assert.equal(jobs[0].date, '2026-05-30');
});

// ---------------------------------------------------------------------------
// normalize: company fallback when company.name is absent
// ---------------------------------------------------------------------------

test('fetchTheHub: falls back company name to "The Hub"', async () => {
  const job = makeJob({ company: null });
  const fetchImpl = fakeFetch([makePage([job])]);
  const jobs = await fetchTheHub(FEED_BASE, { fetchImpl });
  assert.equal(jobs[0].company, 'The Hub');
});

// ---------------------------------------------------------------------------
// normalize: non-remote job gets workplaceType Onsite
// ---------------------------------------------------------------------------

test('fetchTheHub: non-remote job gets workplaceType Onsite', async () => {
  const job = makeJob({ isRemote: false });
  const fetchImpl = fakeFetch([makePage([job])]);
  const jobs = await fetchTheHub(FEED_BASE, { fetchImpl });
  assert.equal(jobs[0].isRemote, false);
  assert.equal(jobs[0].workplaceType, 'Onsite');
});

// ---------------------------------------------------------------------------
// pagination: stops at pages total even when maxPages is higher
// ---------------------------------------------------------------------------

test('fetchTheHub: pagination stops at pages total', async () => {
  // Each page returns 15 docs (full page) so the short-page guard doesn't fire.
  // pages=2 means the API has 2 total pages; the loop must stop after page 2.
  let callCount = 0;
  const fetchImpl = async () => {
    callCount++;
    const docs = Array.from({ length: 15 }, (_, i) =>
      makeJob({ id: callCount * 100 + i, absoluteJobUrl: `https://thehub.io/jobs/j-${callCount}-${i}` }),
    );
    return { ok: true, json: async () => ({ docs, pages: 2, page: callCount, total: 30, limit: 15 }) };
  };
  await fetchTheHub(FEED_BASE, { fetchImpl, maxPages: 10 });
  assert.equal(callCount, 2, 'should stop after 2 pages (pages total)');
});

// ---------------------------------------------------------------------------
// pagination: stops when a short page is returned (< PER_PAGE = 15)
// ---------------------------------------------------------------------------

test('fetchTheHub: pagination stops on short page', async () => {
  let callCount = 0;
  const fetchImpl = async () => {
    callCount++;
    // page 1: 15 jobs (full), pages = 99; page 2: 3 jobs (short → last)
    const count = callCount === 1 ? 15 : 3;
    const docs = Array.from({ length: count }, (_, i) =>
      makeJob({ id: callCount * 100 + i, absoluteJobUrl: `https://thehub.io/jobs/job-${callCount}-${i}` }),
    );
    return { ok: true, json: async () => ({ docs, pages: 99, page: callCount, total: 99, limit: 15 }) };
  };
  await fetchTheHub(FEED_BASE, { fetchImpl, maxPages: 5 });
  assert.equal(callCount, 2);
});

// ---------------------------------------------------------------------------
// maxPages clamp: values below 1 clamp to 1, values above 50 clamp to 50
// ---------------------------------------------------------------------------

test('fetchTheHub: maxPages clamps to [1, 50]', async () => {
  // Each page returns 15 docs (full) so pagination only stops at the maxPages cap.
  // pages=999 so the pages-total guard won't fire before our cap.
  let callCount = 0;
  const makeFullPage = () => {
    callCount++;
    const docs = Array.from({ length: 15 }, (_, i) =>
      makeJob({ id: callCount * 100 + i, absoluteJobUrl: `https://thehub.io/jobs/clamp-${callCount}-${i}` }),
    );
    return { ok: true, json: async () => ({ docs, pages: 999, page: callCount, total: 9999, limit: 15 }) };
  };

  callCount = 0;
  await fetchTheHub(FEED_BASE, { fetchImpl: async () => makeFullPage(), maxPages: 0 });
  assert.equal(callCount, 1, 'maxPages=0 clamps to 1');

  callCount = 0;
  await fetchTheHub(FEED_BASE, { fetchImpl: async () => makeFullPage(), maxPages: 9999 });
  assert.equal(callCount, 50, 'maxPages=9999 clamps to 50');
});

// ---------------------------------------------------------------------------
// first-page HTTP error throws
// ---------------------------------------------------------------------------

test('fetchTheHub: throws on first-page HTTP error', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 });
  await assert.rejects(
    () => fetchTheHub(FEED_BASE, { fetchImpl }),
    /HTTP 503/,
  );
});

// ---------------------------------------------------------------------------
// first-page malformed response throws
// ---------------------------------------------------------------------------

test('fetchTheHub: throws on malformed first-page response', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ notDocs: true }) });
  await assert.rejects(
    () => fetchTheHub(FEED_BASE, { fetchImpl }),
    /unexpected API response/,
  );
});

// ---------------------------------------------------------------------------
// assertTheHubUrl: host-lock and HTTPS enforcement
// ---------------------------------------------------------------------------

test('assertTheHubUrl: accepts valid thehub.io HTTPS URL', () => {
  assert.equal(assertTheHubUrl(FEED_BASE), FEED_BASE);
  assert.equal(assertTheHubUrl('https://thehub.io/jobs/foo'), 'https://thehub.io/jobs/foo');
});

test('assertTheHubUrl: rejects non-HTTPS', () => {
  assert.throws(() => assertTheHubUrl('http://thehub.io/api/jobs'), /must use HTTPS/);
});

test('assertTheHubUrl: rejects off-host', () => {
  assert.throws(() => assertTheHubUrl('https://evil.com/api/jobs'), /untrusted hostname/);
});

test('assertTheHubUrl: rejects invalid URL', () => {
  assert.throws(() => assertTheHubUrl('not-a-url'), /invalid URL/);
});

// ---------------------------------------------------------------------------
// Adapter: matches + buildEndpoint
// ---------------------------------------------------------------------------

test('adapter: matches only on provider=thehub', () => {
  assert.ok(thehubAdapter.matches({ provider: 'thehub' }));
  assert.equal(thehubAdapter.matches({ provider: 'remotive' }), false);
  assert.equal(thehubAdapter.matches({ careers_url: 'https://thehub.io' }), false);
});

test('adapter: buildEndpoint returns FEED_BASE when no override', () => {
  assert.equal(thehubAdapter.buildEndpoint({ provider: 'thehub' }), FEED_BASE);
});

test('adapter: buildEndpoint prefers thehub: key, then api:', () => {
  assert.equal(
    thehubAdapter.buildEndpoint({ provider: 'thehub', thehub: 'https://thehub.io/api/jobs?category=tech' }),
    'https://thehub.io/api/jobs?category=tech',
  );
  assert.equal(
    thehubAdapter.buildEndpoint({ provider: 'thehub', api: 'https://thehub.io/api/jobs?remote=true' }),
    'https://thehub.io/api/jobs?remote=true',
  );
});

test('adapter: id and label', () => {
  assert.equal(thehubAdapter.id, 'thehub');
  assert.equal(thehubAdapter.label, 'The Hub');
});
