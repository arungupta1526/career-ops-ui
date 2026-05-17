/**
 * v1.33.0 (WS4) — `location_filter` parity with parent career-ops 1.8.0 (#570).
 *
 * Parent's `scan.mjs` gained an optional `location_filter` block in
 * `portals.yml`. web-ui runs its OWN in-process scanners
 * (`en-scanner.mjs` / `ru-scanner.mjs`) — they do NOT shell out to the
 * parent's `scan.mjs`, so the parent feature does not flow through
 * automatically. This module mirrors the parent's `buildLocationFilter`
 * semantics EXACTLY so both scanners gain the same behaviour.
 *
 * portals.yml:
 *   location_filter:
 *     allow: ["Remote", "United States", "Atlanta"]
 *     block: ["India", "London", "Germany"]
 *
 * Semantics (verbatim from parent scan.mjs):
 *   - No `location_filter` key            → everything passes.
 *   - Empty/missing location on a job     → pass (don't penalize missing data).
 *   - `block` match                       → reject (takes precedence over allow).
 *   - `allow` empty                       → pass (already cleared block).
 *   - `allow` non-empty                   → must match ≥ 1 keyword.
 *   - All matches: case-insensitive substring.
 */

/**
 * @param {{allow?: string[], block?: string[]}|null|undefined} locationFilter
 * @returns {(location: string) => boolean} predicate — true = keep the job
 */
export function buildLocationFilter(locationFilter) {
  if (!locationFilter || typeof locationFilter !== 'object') return () => true;
  const allow = (Array.isArray(locationFilter.allow) ? locationFilter.allow : [])
    .map((k) => String(k).toLowerCase());
  const block = (Array.isArray(locationFilter.block) ? locationFilter.block : [])
    .map((k) => String(k).toLowerCase());

  return (location) => {
    if (!location) return true;
    const lower = String(location).toLowerCase();
    if (block.length > 0 && block.some((k) => lower.includes(k))) return false;
    if (allow.length === 0) return true;
    return allow.some((k) => lower.includes(k));
  };
}
