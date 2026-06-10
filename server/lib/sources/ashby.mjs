/**
 * Ashby public posting-api wrapper.
 *   GET https://api.ashbyhq.com/posting-api/job-board/<slug>?includeCompensation=true
 */
const UA = 'career-ops-web-ui/1.0';

// v1.69.0 (P-14) — self-describing adapter metadata. The registry
// auto-discovers every `*.mjs` in this folder and collects each
// module's `meta` export, so adding a new source is a pure file
// drop — no edit to registry.mjs required.
export const meta = {
  value: 'ashby',
  label: 'Ashby',
  region: 'en',
};

export async function fetchAshby(apiUrl, opts = {}) {
  const { fetchImpl = fetch, signal } = opts; // REVIEW-B3
  const res = await fetchImpl(apiUrl, { signal, headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Ashby: HTTP ${res.status} (${apiUrl})`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return (data.jobs || []).map((j) => normalize(j));
}

function normalize(j) {
  const loc = j.location || '';
  const secLoc = (j.secondaryLocations || []).map((l) => l.location || l.name).filter(Boolean);
  const isRemote = j.isRemote === true || /remote/i.test(j.workplaceType || '');
  const wt = j.workplaceType || (isRemote ? 'Remote' : 'Onsite');

  // Compensation summary
  let salary = '';
  const tier = j.compensation?.compensationTierSummary;
  if (tier) salary = tier;
  else if (j.compensation?.summaryComponents?.length) {
    salary = j.compensation.summaryComponents
      .map((s) => s.compensationType + ' ' + (s.summary || ''))
      .join(', ');
  }

  return {
    id: `ashby-${j.id}`,
    title: j.title || '',
    company: '',
    url: j.jobUrl || j.applyUrl || '',
    salary,
    location: [loc, ...secLoc].filter(Boolean).join(' · '),
    isRemote,
    workplaceType: wt,
    relocates: false,
    date: j.publishedAt || '',
    snippet: '',
    source: 'ashby',
  };
}
