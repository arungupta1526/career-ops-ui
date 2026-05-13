/**
 * Workday CXS public jobs API wrapper (BETA).
 *
 * Workday hosts each customer at `<tenant>.wd<N>.myworkdayjobs.com`
 * (N is usually 1, 5, or 12). The unauthenticated jobs feed lives at
 *   POST https://<tenant>.wd<N>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs
 * with body `{ appliedFacets: {}, limit, offset, searchText: "" }`.
 *
 * Marked beta because:
 *   - The endpoint per-customer (site path varies)
 *   - Some customers gate the feed behind a CAPTCHA on /wday/cxs/...
 *   - Pagination requires a POST loop; we only fetch the first page.
 *
 * If a Workday board returns 4xx, the help bundle suggests falling back
 * to the AI scan (`/career-ops scan`) which can drive a real browser
 * via Playwright.
 */
const UA = 'career-ops-web-ui/1.0';
const PAGE_LIMIT = 100;

export async function fetchWorkday(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal } = opts;
  const res = await fetchImpl(apiUrl, {
    method: 'POST',
    signal,
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      appliedFacets: {},
      limit: PAGE_LIMIT,
      offset: 0,
      searchText: '',
    }),
  });
  if (!res.ok) {
    const err = new Error(`Workday: HTTP ${res.status} (${apiUrl})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  // The Workday CXS response wraps job rows under `jobPostings`.
  const base = apiUrl.replace(/\/wday\/cxs\/.+$/, '');
  return (data.jobPostings || []).map((j) => normalize(j, base));
}

function normalize(j, base) {
  const path = j.externalPath || '';
  const url = path.startsWith('http') ? path : (base + path);
  const loc = j.locationsText || j.bulletFields?.[0] || '';
  const isRemote = /remote|anywhere/i.test(loc) || /\bremote\b/i.test(j.title || '');
  const hybrid = /hybrid/i.test(loc);
  return {
    id: `wd-${j.bulletFields?.[1] || j.title}`,
    title: j.title || '',
    company: '',  // Workday CXS doesn't echo the tenant name in payload.
    url,
    salary: '',
    location: loc,
    isRemote,
    workplaceType: isRemote ? 'Remote' : (hybrid ? 'Hybrid' : 'Onsite'),
    relocates: /\b(visa|relocation|sponsorship)\b/i.test(j.title || ''),
    date: j.postedOn || '',
    snippet: '',
    source: 'workday',
  };
}
