/**
 * Hacker News adapter (registry contract).
 *
 * Board-wide source — matches ONLY on `provider: hackernews`. The endpoint
 * returned by buildEndpoint is nominal (fetchHackerNews always uses SEARCH_URL
 * internally), but must be a non-null string so resolveAdapter accepts it.
 *
 * Example portals.yml entry:
 *
 *   tracked_companies:
 *     - name: Hacker News
 *       provider: hackernews
 *       enabled: true
 */
import { fetchHackerNews } from '../../sources/hackernews.mjs';

export const hackernewsAdapter = {
  id: 'hackernews',
  label: 'Hacker News (Who is hiring)',
  matches(company) {
    return company.provider === 'hackernews';
  },
  buildEndpoint(company) {
    return company.hackernews || company.api || 'https://hn.algolia.com';
  },
  fetch: fetchHackerNews,
};
