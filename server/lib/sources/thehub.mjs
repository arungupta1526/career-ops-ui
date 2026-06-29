/**
 * The Hub source — board-wide public JSON API (Nordic / EU startups).
 *   GET https://thehub.io/api/jobs?page=N
 *
 * Response shape: { docs: [ { id, title, company: { name }, location: { address,
 *   locality, country }, absoluteJobUrl, isRemote, publishedAt, createdAt,
 *   ... } ], total, page, pages, limit }
 *
 * Paginated 15/page via `?page=N` (1-indexed); `pages` field bounds the loop.
 * Default cap is 3 pages; override via opts.maxPages (clamped to [1, 50]).
 *
 * Ported from parent career-ops `providers/thehub.mjs` — reimplemented to the
 * web-ui source contract (no code lifted).
 *
 * Used by the thehub adapter (server/lib/portals/adapters/thehub.mjs).
 */

const UA = 'career-ops-web-ui/1.0';
const TRUSTED_HOST = 'thehub.io';
const PER_PAGE = 15;
const DEFAULT_MAX_PAGES = 3;
const MAX_PAGES_CAP = 50;

export const FEED_BASE = 'https://thehub.io/api/jobs';

export const meta = {
  value: 'thehub',
  label: 'The Hub',
  region: 'en',
};

/**
 * Assert that `url` points to thehub.io over HTTPS. Throws on failure.
 * @param {string} url
 * @returns {string} the validated url
 */
export function assertTheHubUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`thehub: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`thehub: URL must use HTTPS: ${url}`);
  }
  if (parsed.hostname !== TRUSTED_HOST) {
    throw new Error(`thehub: untrusted hostname "${parsed.hostname}" — must be ${TRUSTED_HOST}`);
  }
  return url;
}

function toIsoDate(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? '' : new Date(ms).toISOString().slice(0, 10);
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanTheHubUrl(value) {
  const raw = cleanText(value);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' && parsed.hostname === TRUSTED_HOST ? parsed.href : '';
  } catch {
    return '';
  }
}

/**
 * Map a raw The Hub job object to the 12-field web-ui normalized shape.
 * Returns null for rows missing a valid title or thehub.io URL.
 * @param {any} j
 * @returns {object|null}
 */
function normalize(j) {
  if (!j || typeof j !== 'object') return null;

  const title = cleanText(j.title);
  if (!title) return null;

  const url = cleanTheHubUrl(j.absoluteJobUrl);
  if (!url) return null;

  const company =
    j.company && typeof j.company === 'object' && cleanText(j.company.name)
      ? cleanText(j.company.name)
      : 'The Hub';

  const loc = j.location && typeof j.location === 'object' ? j.location : {};
  const address = cleanText(loc.address);
  const locality = cleanText(loc.locality);
  const country = cleanText(loc.country);
  const base = address || [locality, country].filter(Boolean).join(', ');
  const remote = j.isRemote === true;
  const location = [base, remote ? 'Remote' : ''].filter(Boolean).join(', ');

  const date = toIsoDate(j.publishedAt) || toIsoDate(j.createdAt);

  return {
    id: `thehub-${j.id != null ? String(j.id) : url}`,
    title,
    company,
    url,
    salary: '',
    location,
    isRemote: remote,
    workplaceType: remote ? 'Remote' : 'Onsite',
    relocates: false,
    date,
    snippet: '',
    source: 'thehub',
  };
}

/**
 * Fetch + normalize The Hub public jobs API (paginated).
 *
 * @param {string} feedUrl  Base API endpoint (default: FEED_BASE)
 * @param {{ fetchImpl?: Function, signal?: AbortSignal, maxPages?: number }} [opts]
 * @returns {Promise<object[]>}
 */
export async function fetchTheHub(feedUrl = FEED_BASE, opts = {}) {
  const { fetchImpl = fetch, signal } = opts;
  const rawMax = opts.maxPages;
  const maxPages = Math.min(
    Math.max(1, Number.isInteger(rawMax) ? rawMax : DEFAULT_MAX_PAGES),
    MAX_PAGES_CAP,
  );

  // Validate the base endpoint before any requests.
  assertTheHubUrl(feedUrl);

  const headers = { 'User-Agent': UA, Accept: 'application/json' };
  const out = [];

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${feedUrl}?page=${page}`;
    const res = await fetchImpl(pageUrl, { signal, redirect: 'error', headers });

    if (!res.ok) {
      // On the first page a non-2xx is a hard failure; later pages are best-effort.
      if (page === 1) {
        const err = new Error(`TheHub: HTTP ${res.status} (${pageUrl})`);
        err.status = res.status;
        throw err;
      }
      break;
    }

    const json = await res.json();

    if (!json || !Array.isArray(json.docs)) {
      if (page === 1) {
        throw new Error(
          `TheHub: unexpected API response on page ${page} — expected { docs: [...] }, got keys: [${json ? Object.keys(json).join(', ') : 'null'}]`,
        );
      }
      break;
    }

    for (const j of json.docs) {
      const normalized = normalize(j);
      if (normalized) out.push(normalized);
    }

    // Stop when we've reached the last page or received a short page.
    const totalPages = Number.isInteger(json.pages) ? json.pages : Infinity;
    if (page >= Math.min(totalPages, maxPages)) break;
    if (json.docs.length < PER_PAGE) break;
  }

  return out;
}
