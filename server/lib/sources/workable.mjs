/**
 * Workable public jobs API wrapper.
 *   GET https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true
 *
 * Pagination is offset/limit; we ask for a generous chunk in one shot.
 * If a board has > 1000 open roles, the second page is dropped — that
 * cap is documented in the help bundle.
 */
const UA = 'career-ops-web-ui/1.0';
const PAGE_LIMIT = 1000;

// v1.69.0 (P-14) — self-describing adapter metadata; see ashby.mjs for the rationale.
export const meta = {
  value: 'workable',
  label: 'Workable',
  region: 'en',
};

export async function fetchWorkable(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal } = opts;
  const sep = apiUrl.includes('?') ? '&' : '?';
  const url = `${apiUrl}${sep}limit=${PAGE_LIMIT}`;
  const res = await fetchImpl(url, {
    signal,
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = new Error(`Workable: HTTP ${res.status} (${url})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.results || data.jobs || []).map((j) => normalize(j));
}

function normalize(j) {
  const loc = [j.location?.city, j.location?.region, j.location?.country_code]
    .filter(Boolean).join(', ');
  const remote = j.remote || /remote|anywhere/i.test(loc) || /\bremote\b/i.test(j.title || '');
  const hybrid = /hybrid/i.test(loc);
  return {
    id: `wk-${j.shortcode || j.id}`,
    title: j.title || '',
    company: j.company || j.account?.name || '',
    url: j.url || j.application_url || j.shortlink || '',
    salary: '',
    location: loc,
    isRemote: !!remote,
    workplaceType: remote ? 'Remote' : (hybrid ? 'Hybrid' : 'Onsite'),
    relocates: /\b(visa|relocation|sponsorship)\b/i.test((j.description || '') + ' ' + (j.title || '')),
    date: j.published_on || j.created_at || '',
    snippet: '',
    source: 'workable',
  };
}
