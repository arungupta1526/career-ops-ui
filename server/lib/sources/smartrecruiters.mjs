/**
 * SmartRecruiters public postings API wrapper.
 *   GET https://api.smartrecruiters.com/v1/companies/<slug>/postings?limit=100
 *
 * Returns { content: [...], totalFound, offset, limit }. We grab the
 * first page only; boards with > 100 open roles surface a note in the
 * help bundle suggesting users narrow with a title filter.
 */
const UA = 'career-ops-web-ui/1.0';

export async function fetchSmartRecruiters(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal } = opts;
  const sep = apiUrl.includes('?') ? '&' : '?';
  const url = `${apiUrl}${sep}limit=100`;
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
  return (data.content || []).map((j) => normalize(j));
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
