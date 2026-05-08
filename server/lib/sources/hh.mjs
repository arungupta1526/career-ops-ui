/**
 * hh.ru scanner. Public API at api.hh.ru.
 *
 * Notes for users outside Russia:
 *   • hh.ru blocks API requests from non-RU IPs with 403.
 *   • If you get 403, set HH_USER_AGENT in .env to your registered app's UA
 *     (https://dev.hh.ru/admin) — that reduces but does not eliminate the block.
 *   • Best run from a Russian IP / VPN exit node.
 *
 * Schema docs: https://github.com/hhru/api
 */

const HH_API = 'https://api.hh.ru/vacancies';
const DEFAULT_UA =
  process.env.HH_USER_AGENT ||
  'career-ops-web-ui/1.0 (sergey-emelyanov@github.com)';

const AREA_MOSCOW = 1;
const AREA_RUSSIA = 113;
const AREA_REMOTE = 1001;

/**
 * Search hh.ru for one query string.
 * Returns array of normalized job objects.
 */
export async function searchHH(query, opts = {}) {
  const {
    area = AREA_RUSSIA,
    perPage = 50,
    onlyRemote = false,
    searchField = 'name',
    fetchImpl = fetch,
    signal, // REVIEW-B3: propagate client-disconnect
  } = opts;

  const params = new URLSearchParams({
    text: query,
    area: String(area),
    per_page: String(perPage),
    search_field: searchField,
  });
  if (onlyRemote) params.set('schedule', 'remote');

  const res = await fetchImpl(`${HH_API}?${params}`, {
    signal,
    headers: {
      'User-Agent': DEFAULT_UA,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let detail = '';
    try {
      const j = JSON.parse(body);
      detail = ' · ' + (j.errors?.[0]?.type || j.description || '');
    } catch {}
    const err = new Error(`hh.ru: HTTP ${res.status}${detail}`);
    err.status = res.status;
    err.geoBlocked = res.status === 403;
    throw err;
  }

  const data = await res.json();
  return (data.items || []).map(normalizeHH);
}

function normalizeHH(item) {
  const sal = item.salary;
  const salStr = sal
    ? [
        sal.from && `от ${sal.from}`,
        sal.to && `до ${sal.to}`,
        sal.currency,
      ]
        .filter(Boolean)
        .join(' ')
    : '';
  // schedule = 'remote' / 'fullDay' / 'flexible' / 'shift'
  const schedule = item.schedule?.id || item.schedule?.name || '';
  const isRemote = schedule === 'remote' || /удал[её]н/i.test(item.schedule?.name || '');
  return {
    id: `hh-${item.id}`,
    title: item.name || '',
    company: item.employer?.name || '',
    url: item.alternate_url || `https://hh.ru/vacancy/${item.id}`,
    salary: salStr,
    location: item.area?.name || '',
    isRemote,
    workplaceType: isRemote ? 'Remote' : (schedule || 'Onsite'),
    relocates: false, // hh.ru rarely flags this; user must check page
    date: item.published_at || '',
    snippet: [item.snippet?.requirement, item.snippet?.responsibility]
      .filter(Boolean)
      .join(' / '),
    source: 'hh.ru',
  };
}

export const HH = { searchHH, AREA_MOSCOW, AREA_RUSSIA, AREA_REMOTE };
