/**
 * Greenhouse public boards-api wrapper.
 *   GET https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
 *
 * Each job has location.name (often "Hybrid - SF, NYC") + offices[].
 */
const UA = 'career-ops-web-ui/1.0';

export async function fetchGreenhouse(apiUrl, opts = {}) {
  const { fetchImpl = fetch } = opts;
  const res = await fetchImpl(apiUrl, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Greenhouse: HTTP ${res.status} (${apiUrl})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.jobs || []).map((j) => normalize(j));
}

function normalize(j) {
  const loc = j.location?.name || '';
  const offices = (j.offices || []).map((o) => o.name).filter(Boolean);
  const allLocs = [loc, ...offices].filter(Boolean).join(' · ');
  const isRemote = /remote|anywhere|fully\s*distributed/i.test(allLocs) ||
                   /\bremote\b/i.test(j.title);
  const isHybrid = /hybrid/i.test(allLocs);
  const relocates = /\b(visa|relocation|relocates?|sponsorship)\b/i.test(allLocs + ' ' + (j.title || ''));
  return {
    id: `gh-${j.id}`,
    title: j.title || '',
    company: j.company_name || '',
    url: j.absolute_url || '',
    salary: '', // greenhouse rarely exposes salary in board-api
    location: loc || (offices[0] || ''),
    isRemote,
    workplaceType: isRemote ? 'Remote' : (isHybrid ? 'Hybrid' : 'Onsite'),
    relocates,
    date: j.first_published || j.updated_at || '',
    snippet: '',
    source: 'greenhouse',
  };
}
