/**
 * Lever public postings API.
 *   GET https://api.lever.co/v0/postings/<slug>
 */
const UA = 'career-ops-web-ui/1.0';

export async function fetchLever(apiUrl, opts = {}) {
  const { fetchImpl = fetch } = opts;
  const res = await fetchImpl(apiUrl, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Lever: HTTP ${res.status} (${apiUrl})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  // lever returns either an array directly OR { ... data: [] }
  const list = Array.isArray(data) ? data : (data.data || []);
  return list.map(normalize);
}

function normalize(j) {
  const cats = j.categories || {};
  const loc = cats.location || '';
  const allLocs = (cats.allLocations || []).join(' · ');
  const isRemote = /remote|anywhere/i.test(loc + ' ' + allLocs);
  const isHybrid = /hybrid/i.test(loc);
  return {
    id: `lever-${j.id}`,
    title: j.text || '',
    company: '',
    url: j.hostedUrl || j.applyUrl || '',
    salary: j.salaryRange?.min ? `${j.salaryRange.min}-${j.salaryRange.max} ${j.salaryRange.currency}` : '',
    location: loc || allLocs,
    isRemote,
    workplaceType: isRemote ? 'Remote' : (isHybrid ? 'Hybrid' : (cats.commitment || 'Onsite')),
    relocates: false,
    date: j.createdAt ? new Date(j.createdAt).toISOString() : '',
    snippet: cats.team || cats.department || '',
    source: 'lever',
  };
}
