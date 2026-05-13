/* global Router, API, UI, I18n */

// Module-level handle for the active scan-results poll. We track it across
// view renders so navigating away from /scan during an in-flight scan
// doesn't leak setInterval timers (one per scan) into the page lifetime.
let __activeScanPollHandle = null;
function __cancelActiveScanPoll() {
  if (__activeScanPollHandle) {
    clearInterval(__activeScanPollHandle);
    __activeScanPollHandle = null;
  }
}
// Cancel on every route change — the renderer always begins from a clean slate.
window.addEventListener('hashchange', __cancelActiveScanPoll);

Router.register('scan', async () => {
  // Clean up any stale poll from a previous /scan visit.
  __cancelActiveScanPoll();
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  let portalsData = null;
  let portalsErr = null;
  let healthData = null;
  try {
    portalsData = await API.get('/api/portals');
  } catch (e) {
    portalsErr = e;
  }
  // Probe the HH_USER_AGENT setup so we can warn before the user clicks
  // RU scan and discovers the 403 the hard way.
  try {
    healthData = await API.get('/api/health');
  } catch {}
  const hhUaSet = healthData?.checks?.find((x) => x.name === 'HH_USER_AGENT')?.ok === true;
  const p = portalsData?.portals || {};
  const companies = (p.tracked_companies || p.companies || []).filter((c) => c.enabled !== false);
  const apiCompanies = companies.filter((co) =>
    co.api ||
    /jobs\.ashbyhq\.com|jobs\.lever\.co|job-boards\.greenhouse\.io/.test(co.careers_url || '')
  );

  const consoleEl = c('pre', { className: 'console', id: 'scan-console' }, t('scan.consoleReady'));
  const resultsEl = c('div', { id: 'scan-results' });

  const dryRun = c('input', { type: 'checkbox', id: 'dry-run' });
  const filterText = c('input', { className: 'input', placeholder: t('scan.filterText'), style: { maxWidth: '320px' } });
  const filterRemote = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: '' }, t('scan.allTypes')),
    c('option', { value: 'remote' }, t('scan.remoteOnly')),
    c('option', { value: 'hybrid' }, t('scan.hybrid')),
    c('option', { value: 'reloc' }, t('scan.reloc')),
  ]);
  // v1.16.0 — source dropdown rebuilt from the v1.14.0 adapter registry
  // (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday)
  // plus the two regional portals (hh.ru, Habr). Alphabetical sort,
  // no geo-tag prefix per F-014.
  const filterSource = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: '' }, t('scan.allSources')),
    c('option', { value: 'ashby' }, 'Ashby'),
    c('option', { value: 'greenhouse' }, 'Greenhouse'),
    c('option', { value: 'habr-career' }, 'Habr Career'),
    c('option', { value: 'hh.ru' }, 'hh.ru'),
    c('option', { value: 'lever' }, 'Lever'),
    c('option', { value: 'smartrecruiters' }, 'SmartRecruiters'),
    c('option', { value: 'workable' }, 'Workable'),
    c('option', { value: 'workday' }, 'Workday'),
  ]);
  const filterScope = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: 'all' }, t('scan.scopeAll')),
    c('option', { value: 'fresh' }, t('scan.scopeFresh')),
  ]);

  const companySelect = c('select', { className: 'select', id: 'company-select' }, [
    c('option', { value: '' }, t('scan.allCompanies')),
    ...apiCompanies.map((co) => c('option', { value: co.name }, co.name)),
  ]);

  function streamTo(consoleEl, path, kind, onDone) {
    consoleEl.textContent = '';
    UI.toast(`${kind} scan…`, 'success');
    // Cancel any prior in-flight poll so back-to-back scan clicks don't
    // accumulate intervals, and assign the new one to the module-level handle
    // so __cancelActiveScanPoll() (on hashchange) can clean up.
    __cancelActiveScanPoll();
    __activeScanPollHandle = setInterval(() => {
      refreshResults().catch(() => {});
    }, 2500);

    API.stream(path, (ev, data) => {
      if (ev === 'log') {
        const cls = data.stream === 'stderr' ? ' err' : '';
        const span = c('span', { className: cls }, data.line + '\n');
        consoleEl.appendChild(span);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      } else if (ev === 'start') {
        appendMeta(consoleEl, `▶ ${data.script}\n`);
      } else if (ev === 'done') {
        __cancelActiveScanPoll();
        const okMsg = data.counts
          ? `\n✓ done · raw=${data.counts.raw}, NEW=${data.counts.fresh}` +
            (data.errors ? ` · ${data.errors} non-fatal errors` : '')
          : `\n✓ exit ${data.code}`;
        appendMeta(consoleEl, okMsg + '\n');
        const fresh = data.counts?.fresh;
        UI.toast(
          fresh != null ? `${kind}: ${fresh} new offers` : `${kind} done`,
          'success'
        );
        // Final refresh + onDone, with a small delay so the JSON file
        // is flushed to disk on the server side.
        setTimeout(() => {
          refreshResults().catch(() => {});
          if (onDone) onDone();
        }, 300);
      } else if (ev === 'error') {
        __cancelActiveScanPoll();
        appendMeta(consoleEl, `\n✗ ${data.message}\n`);
        UI.toast(data.message, 'error');
      }
    });
  }

  // v1.16.0 — both runEnScan / runRuScan now hit the consolidated
  // endpoint `/api/stream/scan?source=ats|regional`. The legacy
  // `/api/stream/scan-{en,ru}` aliases stay live with Sunset headers
  // through v1.16 but are no longer the SPA's transport.
  function runEnScan() {
    const params = new URLSearchParams();
    params.set('source', 'ats');
    if (dryRun.checked) params.set('dryRun', '1');
    const company = companySelect.value;
    if (company) params.set('company', company);
    streamTo(consoleEl, '/api/stream/scan?' + params.toString(), 'ATS', refreshResults);
  }
  function runRuScan() {
    const params = new URLSearchParams();
    params.set('source', 'regional');
    if (dryRun.checked) params.set('dryRun', '1');
    streamTo(consoleEl, '/api/stream/scan?' + params.toString(), 'Regional', refreshResults);
  }
  // v1.12.0 — single SSE connection to the consolidated endpoint.
  // The server runs ATS then regional sequentially and emits multiple
  // `start` / `done` events in one stream so the UI sees both phases.
  // (Old separate `/api/stream/scan-en` + `/api/stream/scan-ru`
  // endpoints stay live as deprecated aliases — F-018 LITE.)
  function runScanAll() {
    const params = new URLSearchParams();
    params.set('source', 'both');
    if (dryRun.checked) params.set('dryRun', '1');
    const company = companySelect.value;
    if (company) params.set('company', company);

    consoleEl.textContent = '';
    UI.toast(t('scan.runAll', 'Scanning all sources…'), 'success');

    let phase = null;       // 'ats' | 'regional' as we move between phases
    let totalNew = 0;
    API.stream('/api/stream/scan?' + params.toString(), (ev, data) => {
      if (ev === 'start') {
        // Inferred from the server-emitted script label so a single stream
        // can carry multiple phases.
        phase = (data.script === 'en-scanner') ? 'ats' : 'regional';
        appendMeta(consoleEl,
          phase === 'ats'
            ? '▶ ATS scan (Greenhouse + Ashby + Lever)\n'
            : '\n▶ Regional scan (hh.ru + Habr Career)\n');
      } else if (ev === 'log') {
        const cls = data.stream === 'stderr' ? ' err' : '';
        consoleEl.appendChild(c('span', { className: cls }, data.line + '\n'));
        consoleEl.scrollTop = consoleEl.scrollHeight;
      } else if (ev === 'done') {
        const fresh = data.counts?.fresh ?? 0;
        totalNew += fresh;
        const label = phase === 'ats' ? 'ATS' : 'Regional';
        appendMeta(consoleEl, `✓ ${label} done · NEW=${fresh}\n`);
        // F-011: re-read /api/scan-results so the Active-Companies counter
        // + filters update incrementally between phases.
        refreshResults();
      } else if (ev === 'error') {
        const label = phase === 'ats' ? 'ATS' : (phase === 'regional' ? 'Regional' : 'scan');
        const msg = (data && data.message) || 'unknown error';
        appendMeta(consoleEl, `\n✗ ${label} error: ${msg}\n`);
        UI.toast(msg, 'error');
      }
    });
    // EventSource closes on the last `done`; show the summary toast then.
    // We can't easily distinguish "ATS done" from "all done" without a
    // server-side `phase: 'final'` marker, so the toast fires on each done
    // and the user reads the meta line for context.
    Promise.resolve().then(() => {
      // Defensive: schedule a final summary once the stream is idle.
      setTimeout(() => {
        if (totalNew > 0) UI.toast(`Scan: ${totalNew} new offers`, 'success');
      }, 800);
    });
  }

  // Render the rich table of last-scan results
  let lastResults = { en: null, ru: null };
  // Active chip selections (multi-select, intersection across categories)
  const activeTech = new Set();
  const activeLevel = new Set();
  const activeDynamic = new Set();

  async function refreshResults() {
    try {
      lastResults = await API.get('/api/scan-results');
    } catch {
      lastResults = { en: null, ru: null };
    }
    renderResults();
    // F-011: notify the Active-Companies counter (and any other listener)
    // that the result corpus changed so they can recompute their labels.
    document.body.dispatchEvent(new CustomEvent('scan:refresh'));
  }
  function getRows() {
    const scope = filterScope.value || 'all';
    const en = lastResults.en;
    const ru = lastResults.ru;
    const enRows = (scope === 'fresh' ? en?.fresh : (en?.filtered || en?.fresh)) || [];
    const ruRows = (scope === 'fresh' ? ru?.fresh : (ru?.filtered || ru?.fresh)) || [];
    return [...enRows, ...ruRows];
  }
  function renderResults() {
    resultsEl.innerHTML = '';
    const allRows = getRows();
    const enWhen = lastResults.en?.when ? new Date(lastResults.en.when).toLocaleString('ru') : null;
    const ruWhen = lastResults.ru?.when ? new Date(lastResults.ru.when).toLocaleString('ru') : null;

    // Header summary — labels neutralized to "ATS / Regional" so the
    // adapter geography isn't baked into the UI (F-010).
    const atsLabel = t('scan.atsBadge', 'ATS adapters');
    const regionalLabel = t('scan.regionalBadge', 'Regional portals');
    const summary = c('div', { className: 'flex gap-3 mb-3', style: { flexWrap: 'wrap' } }, [
      enWhen && c('span', { className: 'badge badge-info' }, `${atsLabel} · ${enWhen} · ${lastResults.en.fresh?.length || 0} new / ${lastResults.en.filtered?.length || 0} matching`),
      ruWhen && c('span', { className: 'badge badge-info' }, `${regionalLabel} · ${ruWhen} · ${lastResults.ru.fresh?.length || 0} new / ${lastResults.ru.filtered?.length || 0} matching`),
    ]);
    resultsEl.appendChild(summary);

    if (!allRows.length) {
      resultsEl.appendChild(c('div', { className: 'empty' }, t('scan.noResults')));
      return;
    }

    // ── Chip facets (skills + level + dynamic keywords) ──
    // Dynamic keywords adapt to whatever roles the user actually scanned —
    // gives meaningful chips even for non-engineering profiles (marketing,
    // design, finance, …) where the hardcoded TECH_GROUPS would be empty.
    const facets = window.Skills.computeFacets(allRows);
    // Filter dynamic keywords by script — non-Russian UI shouldn't show
    // Cyrillic-only tokens like "разработчик" leaking from Habr data.
    const lang = (window.I18n && I18n.getLang()) || 'en';
    const script = lang === 'ru' ? 'all' : 'latin';
    const dynKeywords = window.Skills.extractDynamicKeywords(allRows, { limit: 20, script });
    const dynCounts = Object.fromEntries(dynKeywords);
    const chipsContainer = c('div', { className: 'mb-3', style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
    if (Object.keys(facets.tech).length) chipsContainer.appendChild(buildChipRow(t('scan.chip.stack'), facets.tech, activeTech));
    if (Object.keys(facets.level).length) chipsContainer.appendChild(buildChipRow(t('scan.chip.level'), facets.level, activeLevel));
    if (dynKeywords.length) chipsContainer.appendChild(buildChipRow(t('scan.chip.dynamic', 'Keywords'), dynCounts, activeDynamic));
    resultsEl.appendChild(chipsContainer);

    // ── Now apply ALL filters (text/remote/source + chips) ──
    const q = (filterText.value || '').toLowerCase().trim();
    const fr = filterRemote.value;
    const fs = filterSource.value;
    const rows = allRows.filter((r) => {
      if (q && !((r.company + ' ' + r.title + ' ' + (r.location || '')).toLowerCase().includes(q))) return false;
      if (fr === 'remote' && !r.isRemote) return false;
      if (fr === 'hybrid' && !/hybrid/i.test(r.workplaceType || '')) return false;
      if (fr === 'reloc' && !r.relocates) return false;
      if (fs && r.source !== fs) return false;
      if (!window.Skills.rowMatches(r, activeTech, activeLevel)) return false;
      if (activeDynamic.size) {
        let any = false;
        for (const k of activeDynamic) if (window.Skills.rowHasKeyword(r, k)) { any = true; break; }
        if (!any) return false;
      }
      return true;
    });
    if (!rows.length) {
      resultsEl.appendChild(c('div', { className: 'empty' }, t('track.noMatch')));
      return;
    }
    // v1.12.0 — sort boosted rows to the top of each render. Stable
    // within the boosted/non-boosted partition so the underlying scan
    // order is preserved otherwise. Boost is sourced from
    // `portals.yml::title_filter.seniority_boost` and stamped server-side
    // by both en-scanner and ru-scanner.
    const sorted = rows.slice(0, 200).sort((a, b) => {
      const ab = a && a._boosted ? 1 : 0;
      const bb = b && b._boosted ? 1 : 0;
      return bb - ab;
    });
    const tbody = c('tbody', null, sorted.map((r) => {
      const wt = r.workplaceType || (r.isRemote ? 'Remote' : 'Onsite');
      const wtClass = /remote/i.test(wt) ? 'badge-ok' : /hybrid/i.test(wt) ? 'badge-info' : '';
      // Title cell shows a "⬆ boosted" pill before the link when the
      // server-side scanner matched a `seniority_boost` keyword on the
      // title. Title attribute reveals WHICH keyword matched, so the
      // user can trace it back to portals.yml.
      const titleCell = c('td', null, [
        r._boosted ? c('span', {
          className: 'badge badge-info',
          title: t('scan.boostedBy', 'Boosted by') + ': ' + (r._boostedBy || '?'),
          style: { marginRight: '6px', fontSize: '11px' },
        }, '⬆ ' + t('scan.boosted', 'boosted')) : null,
        c('a', { href: r.url, target: '_blank', rel: 'noopener', style: { color: 'var(--rausch)' } }, r.title),
      ]);
      return c('tr', null, [
        c('td', { style: { minWidth: '160px' } }, r.company || '—'),
        titleCell,
        c('td', { style: { fontSize: '13px', color: 'var(--foggy)' } }, r.location || '—'),
        c('td', null, c('span', { className: 'badge ' + wtClass }, wt)),
        c('td', null, r.relocates ? c('span', { className: 'badge badge-info' }, 'reloc') : ''),
        c('td', { style: { fontSize: '13px', color: 'var(--foggy)' } }, r.salary || ''),
        c('td', null, c('span', { className: 'tag' }, r.source)),
      ]);
    }));
    resultsEl.appendChild(c('div', { className: 'table-wrap' },
      c('table', { className: 'tbl' }, [
        c('thead', null, c('tr', null,
          [t('scan.col.company'), t('scan.col.role'), t('scan.col.loc'), t('scan.col.type'), 'Reloc', t('scan.col.salary'), t('scan.col.source')].map((h) => c('th', null, h))
        )),
        tbody,
      ])
    ));
    if (rows.length > 200) {
      resultsEl.appendChild(c('p', { className: 'field-hint', style: { textAlign: 'center', marginTop: '12px' } },
        `${t('scan.shownTop')} ${rows.length}.`));
    }
  }

  ;[filterText, filterRemote, filterSource, filterScope].forEach((el) => el.addEventListener('input', renderResults));

  // Build a chip row for one facet category. Active selections survive across re-renders
  // because activeTech / activeLevel are scoped above.
  function buildChipRow(label, counts, activeSet) {
    const row = c('div', { className: 'chip-row' }, c('span', { className: 'chip-label' }, label));
    // Sort by count desc, then alpha
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!ordered.length) {
      row.appendChild(c('span', { style: { color: 'var(--foggy)', fontSize: '12px' } }, '—'));
      return row;
    }
    for (const [name, count] of ordered) {
      const isOn = activeSet.has(name);
      const chip = c('span', {
        className: 'chip' + (isOn ? ' on' : ''),
        onClick: () => {
          if (activeSet.has(name)) activeSet.delete(name);
          else activeSet.add(name);
          renderResults();
        },
      }, [name, c('span', { className: 'chip-count' }, String(count))]);
      row.appendChild(chip);
    }
    if (activeSet.size) {
      row.appendChild(c('span', {
        className: 'chip clear',
        onClick: () => { activeSet.clear(); renderResults(); },
      }, t('scan.chip.clear')));
    }
    return row;
  }

  // load results on first render
  refreshResults();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('scan.title')),
        // F-010: neutral label, no EN/RU split. apiCompanies is the
        // count of ATS-tracked companies; the rest are regional portals.
        c('p', { className: 'page-subtitle' }, t('scan.subtitle')),
      ]),
    ]),

    // HH_USER_AGENT diagnostics moved to the Health page only — having
    // it as a card here was loud, persistent, and irrelevant to anyone
    // not hitting a 403 from hh.ru. The Health check still surfaces it.
    null,

    c('div', { className: 'card mb-3' }, [
      c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap', alignItems: 'flex-end' } }, [
        c('div', { className: 'field', style: { flex: 1, marginBottom: 0, minWidth: '220px' } }, [
          c('label', null, t('scan.companyLbl')),
          companySelect,
        ]),
        c('label', { className: 'flex', style: { gap: '8px', userSelect: 'none' } }, [
          dryRun, c('span', null, t('scan.dryRun')),
        ]),
        // Single "Scan" button — runs every enabled source (EN APIs +
        // RU portals) in one go. The earlier separate EN-scan / RU-scan
        // buttons were noisy; users almost always want everything.
        // Title attribute lists what it actually crawls so the
        // expectation is set on hover.
        c('button', {
          className: 'btn btn-primary scan-run-btn',
          onClick: runScanAll,
          title: 'Greenhouse + Ashby + Lever + hh.ru + Habr Career',
        }, '🌐 ' + t('scan.btnRun', 'Scan')),
        c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/pipeline') }, t('scan.btnPipe')),
      ]),
    ]),

    c('div', null, consoleEl),

    c('section', { className: 'section' }, [
      c('div', { className: 'flex-between mb-3', style: { flexWrap: 'wrap', gap: '12px' } }, [
        c('h2', { className: 'section-title', style: { margin: 0 } }, t('scan.results')),
        c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } },
          [filterScope, filterText, filterRemote, filterSource]),
      ]),
      resultsEl,
    ]),

    (() => {
      // Companies list — collapsed by default, expand on click, with a
      // search filter + visual grouping by API support. 87 entries flat
      // is overwhelming; this lets the user dive in only when needed.
      const list = c('div', {
        className: 'flex',
        style: { flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
      });
      const filterIn = c('input', {
        className: 'input',
        placeholder: t('scan.companiesFilter', 'Filter companies…'),
        style: { maxWidth: '320px', marginTop: '12px', display: 'none' },
      });
      let expanded = false;
      let query = '';

      function rerender() {
        list.innerHTML = '';
        const q = query.trim().toLowerCase();
        const matched = q
          ? companies.filter((co) => (co.name || '').toLowerCase().includes(q))
          : companies;
        // Group: API-backed first, websearch-only second.
        const apiSet = new Set(apiCompanies);
        const apis = matched.filter((co) => apiSet.has(co));
        const others = matched.filter((co) => !apiSet.has(co));
        // Each company tag is a flex-row of two buttons:
        //   1. Name button — clicking it pre-fills the results-table
        //      filter with the company name (so the user immediately
        //      sees that company's hits in the table above).
        //   2. ↗ link button — only shown when careers_url is set;
        //      opens the careers page in a new tab.
        const tag = (co, hasApi) => {
          const name = co.name || co;
          const careersUrl = co.careers_url || co.careersUrl || (co._api && co._api.url);
          const wrap = c('span', {
            className: 'tag',
            style: {
              fontSize: '13px',
              background: hasApi ? 'rgba(0,138,5,.10)' : 'var(--beach)',
              color: hasApi ? 'var(--kazan)' : 'var(--foggy)',
              padding: '4px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            },
          });
          const filterBtn = c('button', {
            type: 'button',
            title: t('scan.tagClickToFilter', 'Click to filter results by this company'),
            style: {
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              font: 'inherit',
              padding: '2px 4px',
              cursor: 'pointer',
            },
            onClick: () => {
              filterText.value = name;
              filterText.dispatchEvent(new Event('input', { bubbles: true }));
              filterText.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },
          }, (hasApi ? '✓ ' : '○ ') + name);
          wrap.appendChild(filterBtn);
          if (careersUrl) {
            const link = c('a', {
              href: careersUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              title: t('scan.tagOpenCareers', 'Open careers page in a new tab'),
              style: {
                textDecoration: 'none',
                color: 'inherit',
                opacity: 0.7,
                padding: '0 2px',
              },
            }, '↗');
            wrap.appendChild(link);
          }
          return wrap;
        };
        if (apis.length) {
          const head = c('div', {
            style: { width: '100%', fontSize: '12px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.04em',
              color: 'var(--kazan)' },
          }, '✓ ' + t('scan.apiBacked', 'Direct API') + ` · ${apis.length}`);
          list.appendChild(head);
          apis.forEach((co) => list.appendChild(tag(co, true)));
        }
        if (others.length) {
          const head = c('div', {
            style: { width: '100%', fontSize: '12px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.04em',
              color: 'var(--foggy)', marginTop: apis.length ? '12px' : 0 },
          }, '○ ' + t('scan.websearchBacked', 'Web-search only') + ` · ${others.length}`);
          list.appendChild(head);
          others.forEach((co) => list.appendChild(tag(co, false)));
        }
        if (matched.length === 0) {
          list.appendChild(c('div', { style: { color: 'var(--foggy)' } }, t('common.empty', 'No results')));
        }
      }

      // F-011: count companies that produced at least one hit in the
      // last scan run. Updated after every refreshResults() via the
      // setLabel closure below. Falls back to the static tracked count
      // before the first scan completes.
      function activeFromLastScan() {
        const rows = getRows();
        const seen = new Set();
        for (const r of rows) {
          const name = (r && (r.company || r.companyName));
          if (name) seen.add(String(name).toLowerCase());
        }
        return seen.size;
      }
      const labelN = () => {
        const fromScan = activeFromLastScan();
        const n = fromScan > 0 ? fromScan : companies.length;
        return `${n}/${apiCompanies.length}`;
      };
      const setLabel = () => {
        toggleBtn.textContent = (expanded ? '▾ ' : '▸ ') + t('scan.activeCo') + ` ${labelN()}`;
      };
      const toggleBtn = c('button', {
        className: 'btn btn-ghost btn-sm',
        onClick: () => {
          expanded = !expanded;
          list.style.display = expanded ? '' : 'none';
          filterIn.style.display = expanded ? '' : 'none';
          setLabel();
          if (expanded) rerender();
        },
      }, '▸ ' + t('scan.activeCo') + ` ${labelN()}`);
      // Hook into the existing refreshResults() flow without restructuring
      // the closure: every renderResults() call invalidates this counter,
      // and renderResults() is itself called from refreshResults() right
      // after the new /api/scan-results comes back. Re-stamp the label
      // every time the SSE done event fires by listening to a custom
      // event the page dispatches on body.
      document.body.addEventListener('scan:refresh', setLabel);

      filterIn.addEventListener('input', (e) => {
        query = e.target.value;
        rerender();
      });
      list.style.display = 'none';

      // v1.17.0 — render a 🔒 chip when the server reports the most
      // recent Workday fetch fell back (CAPTCHA / 4xx / non-JSON HTML).
      // The /api/scan-results endpoint exposes workdayFallback as part
      // of the latest snapshot. Empty when no fallback has occurred.
      const wdFallback = c('div', {
        id: 'workday-fallback-chip',
        style: { display: 'none', marginBottom: '12px', padding: '8px 12px',
          background: 'rgba(244, 173, 47, .12)', borderLeft: '3px solid var(--warn, #f4ad2f)',
          borderRadius: '4px', fontSize: '13px' },
      });
      // Hook into the same refresh dispatch as Active Companies counter.
      // Reads workdayFallback from /api/scan-results when it lands.
      function refreshWorkdayChip() {
        fetch('/api/scan-results').then((r) => r.json()).then((d) => {
          const wf = d && d.workdayFallback;
          if (!wf || !wf.apiUrl) {
            wdFallback.style.display = 'none';
            return;
          }
          const tenant = (wf.apiUrl.match(/https?:\/\/([^./]+)\./) || [, 'unknown'])[1];
          wdFallback.innerHTML = '';
          wdFallback.appendChild(c('strong', null, '🔒 ' + t('scan.workdayBlocked', 'Workday tenant blocked')));
          wdFallback.appendChild(c('span', { style: { marginLeft: '8px', color: 'var(--foggy)' } },
            `${tenant} · ${wf.reason} · ` + t('scan.workdayFallbackHint',
              'fallback: use /career-ops scan (Playwright) for this tenant')));
          wdFallback.style.display = '';
        }).catch(() => { /* network blip — chip stays hidden */ });
      }
      document.body.addEventListener('scan:refresh', refreshWorkdayChip);
      // Initial check on page load so users who navigate to /#/scan after
      // a prior session's blocked Workday see the chip immediately.
      refreshWorkdayChip();

      return c('div', { className: 'card mt-5' }, [
        wdFallback,
        portalsErr
          ? c('div', { className: 'empty' }, [
              c('strong', null, t('scan.failedPortals')),
              c('p', { style: { color: 'var(--foggy)', marginTop: '8px' } }, portalsErr.message),
            ])
          : companies.length === 0
          ? c('div', { className: 'empty' }, t('scan.allDisabled'))
          : c('div', null, [toggleBtn, filterIn, list]),
      ]);
    })(),
  ]);
});

function appendMeta(el, text) {
  const span = document.createElement('span');
  span.className = 'meta';
  span.textContent = text;
  el.appendChild(span);
  el.scrollTop = el.scrollHeight;
}
