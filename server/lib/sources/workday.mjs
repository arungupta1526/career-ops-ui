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
 * v1.16.0 — graceful CAPTCHA / 4xx fallback. Instead of throwing
 * (which used to break the whole scan), the wrapper returns an
 * empty job array and annotates the result with a fallback hint
 * so /#/scan can render 🔒 chips for blocked tenants. Callers can
 * opt back into the throw behaviour via `opts.strict=true`.
 *
 * Fallback detection rules:
 *   - 4xx (403, 404, 429) — CAPTCHA or tenant-not-public
 *   - non-JSON response (HTML CAPTCHA page) — same outcome
 * Both → returns []. Caller can inspect `lastWorkdayFallback` for
 * audit / activity-log purposes.
 *
 * Help bundle suggestion (career-ops.org/docs/.../set-up-playwright):
 * for a CAPTCHA-gated Workday board, fall back to the AI scan
 * (`/career-ops scan`) which drives a real browser via Playwright.
 */
const UA = 'career-ops-web-ui/1.0';
const PAGE_LIMIT = 100;

// Module-level snapshot of the last fallback reason. Scanner uses
// this for status reporting via /#/scan Active Companies card.
// v1.17.0 — exposed via getLastWorkdayFallback() too so SSE consumers
// (server/lib/routes/scan.mjs) don't have to rely on ESM live bindings.
export let lastWorkdayFallback = null;

export function getLastWorkdayFallback() {
  return lastWorkdayFallback;
}

function setFallback(apiUrl, reason) {
  lastWorkdayFallback = { apiUrl, reason, at: new Date().toISOString() };
}

export async function fetchWorkday(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal, strict = false } = opts;
  let res;
  try {
    res = await fetchImpl(apiUrl, {
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
  } catch (e) {
    // Network-level error (DNS, connect, timeout). Treat as fallback
    // unless caller opted into strict mode.
    if (strict) throw e;
    setFallback(apiUrl, `network: ${e.message}`);
    return [];
  }
  if (!res.ok) {
    // 4xx / 5xx — CAPTCHA / tenant gone / WAF / etc. Graceful fallback.
    const reason = `HTTP ${res.status}`;
    if (strict) {
      const err = new Error(`Workday: ${reason} (${apiUrl})`);
      err.status = res.status;
      err.fallback = true;
      throw err;
    }
    setFallback(apiUrl, reason);
    return [];
  }
  // Some CAPTCHA gates serve HTML with 200; detect by trying to parse
  // as JSON and bailing softly on parse error.
  let data;
  try {
    data = await res.json();
  } catch (e) {
    if (strict) throw e;
    setFallback(apiUrl, 'non-JSON response (likely CAPTCHA HTML)');
    return [];
  }
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
