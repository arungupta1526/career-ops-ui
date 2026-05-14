/**
 * Trudvsem.ru scanner — Russian government job-board ("Работа в России").
 *
 * Endpoint: https://opendata.trudvsem.ru/api/v1/vacancies?text=<q>&limit=<n>
 * Auth:     none (public open-data API).
 * Geo:      no IP gate (works from any country).
 *
 * Response shape (v1):
 *   { status, meta: { total, limit, offset }, results: { vacancies: [
 *       { vacancy: { id, vac_url, job-name, salary_min, salary_max,
 *                    currency, region: { name }, company: { name },
 *                    schedule, work-places, creation-date, duty, ... } }
 *     ] } }
 *
 * Schema docs: https://trudvsem.ru/opendata/api
 */

const TRUDVSEM_API = 'https://opendata.trudvsem.ru/api/v1/vacancies';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Safari/605.1.15';

/**
 * Search Trudvsem for one query string.
 * Returns array of normalized job objects.
 */
export async function searchTrudvsem(query, opts = {}) {
  const {
    perPage = 50,
    onlyRemote = false,
    fetchImpl = fetch,
    signal,
  } = opts;

  const params = new URLSearchParams({
    text: query,
    limit: String(perPage),
    offset: '0',
  });

  const res = await fetchImpl(`${TRUDVSEM_API}?${params}`, {
    signal,
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });

  if (!res.ok) {
    const err = new Error(`Trudvsem: HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const list = data?.results?.vacancies || [];
  const norm = list.map(normalizeTrudvsem).filter(Boolean);
  if (onlyRemote) return norm.filter((j) => j.isRemote);
  return norm;
}

/** Normalize one Trudvsem record into the common job shape. */
export function normalizeTrudvsem(rec) {
  if (!rec) return null;
  const v = rec.vacancy || rec; // API wraps each entry in `{ vacancy: {...} }`.
  if (!v) return null;

  const id = v.id || '';
  const title = v['job-name'] || v.jobName || '';
  if (!title) return null;

  const company = v?.company?.name || v.companyName || '';
  const url = v.vac_url || v.url || '';
  const region = v?.region?.name || '';
  const schedule = (v.schedule || '').toString();
  const workplaces = (v['work-places'] || '').toString();
  const isRemote = /удал[её]н|remote/i.test(schedule + ' ' + workplaces + ' ' + title);
  const date = v['creation-date'] || v.creationDate || '';

  const salMin = v.salary_min ?? v.salaryMin;
  const salMax = v.salary_max ?? v.salaryMax;
  const currency = v.currency || 'RUB';
  const salary = [
    salMin ? `от ${salMin}` : null,
    salMax ? `до ${salMax}` : null,
    (salMin || salMax) ? currency : null,
  ].filter(Boolean).join(' ');

  return {
    id: id ? `trudvsem-${id}` : `trudvsem-${title.slice(0, 20).replace(/\s+/g, '_')}`,
    title: String(title).trim(),
    company: String(company).trim(),
    url: url || `https://trudvsem.ru/vacancy/${encodeURIComponent(id)}`,
    salary,
    location: region || 'Russia',
    isRemote,
    workplaceType: isRemote ? 'Remote' : (schedule || 'Onsite'),
    relocates: false,
    date,
    snippet: (v.duty || '').toString().slice(0, 240),
    source: 'trudvsem',
  };
}

export const TRUDVSEM = { searchTrudvsem, normalizeTrudvsem };
