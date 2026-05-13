/**
 * SmartRecruiters public postings API wrapper.
 *   GET https://api.smartrecruiters.com/v1/companies/<slug>/postings?limit=100&offset=N
 *
 * Returns { content: [...], totalFound, offset, limit }. v1.16.0 follows
 * the totalFound / offset pagination cursor across pages so large
 * boards (Procter & Gamble, Amazon-style with 1000+ open roles)
 * surface all postings, not just the first 100. Safety cap is 30
 * pages (3000 jobs) — the in-process scanner timeline would lose
 * value past that and the title_filter culls hard anyway.
 */
const UA = 'career-ops-web-ui/1.0';
const PAGE_SIZE = 100;
const MAX_PAGES = 30;        // 3000 jobs hard ceiling
const MAX_TOTAL_JOBS = MAX_PAGES * PAGE_SIZE;

export async function fetchSmartRecruiters(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal } = opts;
  // Strip any caller-supplied ?limit= / ?offset= so we own the cursor.
  const base = apiUrl.replace(/[?&](limit|offset)=[^&]*/g, '').replace(/\?$/, '');
  const sep = base.includes('?') ? '&' : '?';

  const all = [];
  let offset = 0;
  let page = 0;
  let totalFound = null;

  while (page < MAX_PAGES) {
    const url = `${base}${sep}limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetchImpl(url, {
      signal,
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (!res.ok) {
      const err = new Error(`SmartRecruiters: HTTP ${res.status} (${url})`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    const batch = (data.content || []).map((j) => normalize(j));
    all.push(...batch);
    if (totalFound == null && typeof data.totalFound === 'number') totalFound = data.totalFound;
    // Stop conditions:
    //   - empty page (no more results)
    //   - reached totalFound (full set fetched)
    //   - hit hard safety cap
    if (batch.length === 0) break;
    if (totalFound != null && all.length >= totalFound) break;
    if (all.length >= MAX_TOTAL_JOBS) break;
    offset += PAGE_SIZE;
    page += 1;
  }
  return all;
}

function normalize(j) {
  const locParts = [j.location?.city, j.location?.region, j.location?.country].filter(Boolean);
  const loc = locParts.join(', ');
  const isRemote = !!j.location?.remote || /remote|anywhere/i.test(loc) || /\bremote\b/i.test(j.name || '');
  const hybrid = /hybrid/i.test(loc);
  return {
    id: `sr-${j.id}`,
    title: j.name || '',
    company: j.company?.name || '',
    url: j.ref || (j.applyUrl ? j.applyUrl : ''),
    salary: '',
    location: loc,
    isRemote,
    workplaceType: isRemote ? 'Remote' : (hybrid ? 'Hybrid' : 'Onsite'),
    relocates: /\b(visa|relocation|sponsorship)\b/i.test((j.name || '') + ' ' + (j.industry?.label || '')),
    date: j.releasedDate || j.createdOn || '',
    snippet: '',
    source: 'smartrecruiters',
  };
}
