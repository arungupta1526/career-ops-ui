/* global Router, API, UI, I18n */
Router.register('scan', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  let portalsData = null;
  let portalsErr = null;
  try {
    portalsData = await API.get('/api/portals');
  } catch (e) {
    portalsErr = e;
  }
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
  const filterSource = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: '' }, t('scan.allSources')),
    c('option', { value: 'greenhouse' }, 'Greenhouse'),
    c('option', { value: 'ashby' }, 'Ashby'),
    c('option', { value: 'lever' }, 'Lever'),
    c('option', { value: 'hh.ru' }, 'hh.ru'),
    c('option', { value: 'habr-career' }, 'Habr'),
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
    UI.toast(`Сканирование (${kind}) запущено…`, 'success');
    API.stream(path, (ev, data) => {
      if (ev === 'log') {
        const cls = data.stream === 'stderr' ? ' err' : '';
        const span = c('span', { className: cls }, data.line + '\n');
        consoleEl.appendChild(span);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      } else if (ev === 'start') {
        appendMeta(consoleEl, `▶ ${data.script}\n`);
      } else if (ev === 'done') {
        const okMsg = data.counts
          ? `\n✓ done · raw=${data.counts.raw}, NEW=${data.counts.fresh}` +
            (data.errors ? ` · ${data.errors} non-fatal errors` : '')
          : `\n✓ exit ${data.code}`;
        appendMeta(consoleEl, okMsg + '\n');
        const fresh = data.counts?.fresh;
        UI.toast(
          fresh != null ? `${kind}: ${fresh} новых офферов` : `${kind} завершён`,
          'success'
        );
        if (onDone) onDone();
      } else if (ev === 'error') {
        appendMeta(consoleEl, `\n✗ ${data.message}\n`);
        UI.toast(data.message, 'error');
      }
    });
  }

  function runEnScan() {
    const params = new URLSearchParams();
    if (dryRun.checked) params.set('dryRun', '1');
    const company = companySelect.value;
    if (company) params.set('company', company);
    streamTo(consoleEl, '/api/stream/scan-en?' + params.toString(), 'EN', refreshResults);
  }
  function runRuScan() {
    const params = new URLSearchParams();
    if (dryRun.checked) params.set('dryRun', '1');
    streamTo(consoleEl, '/api/stream/scan-ru?' + params.toString(), 'RU', refreshResults);
  }
  // Unified "Scan all" — runs EN first, then RU sequentially. Results from both
  // accumulate into the same table because both write to data/last-scan.json.
  function runScanAll() {
    const enParams = new URLSearchParams();
    if (dryRun.checked) enParams.set('dryRun', '1');
    const company = companySelect.value;
    if (company) enParams.set('company', company);

    consoleEl.textContent = '';
    UI.toast(t('scan.runAll', 'Scanning all sources…'), 'success');
    appendMeta(consoleEl, '▶ EN scan (Greenhouse + Ashby + Lever)\n');

    const es1 = API.stream('/api/stream/scan-en?' + enParams.toString(), (ev, data) => {
      if (ev === 'log') {
        const cls = data.stream === 'stderr' ? ' err' : '';
        consoleEl.appendChild(c('span', { className: cls }, data.line + '\n'));
        consoleEl.scrollTop = consoleEl.scrollHeight;
      } else if (ev === 'done') {
        const enFresh = data.counts?.fresh ?? 0;
        appendMeta(consoleEl, `✓ EN done · NEW=${enFresh}\n\n▶ RU scan (hh.ru + Habr Career)\n`);
        // chain RU scan after EN finishes
        const ruParams = new URLSearchParams();
        if (dryRun.checked) ruParams.set('dryRun', '1');
        API.stream('/api/stream/scan-ru?' + ruParams.toString(), (ev2, d2) => {
          if (ev2 === 'log') {
            const cls = d2.stream === 'stderr' ? ' err' : '';
            consoleEl.appendChild(c('span', { className: cls }, d2.line + '\n'));
            consoleEl.scrollTop = consoleEl.scrollHeight;
          } else if (ev2 === 'done') {
            const ruFresh = d2.counts?.fresh ?? 0;
            const total = enFresh + ruFresh;
            appendMeta(consoleEl, `✓ RU done · NEW=${ruFresh}\n\n✓ ALL DONE · total NEW=${total}\n`);
            UI.toast(`Scan all: ${total} new offers`, 'success');
            refreshResults();
          } else if (ev2 === 'error') {
            appendMeta(consoleEl, `\n✗ RU error: ${d2.message}\n`);
          }
        });
      } else if (ev === 'error') {
        appendMeta(consoleEl, `\n✗ EN error: ${data.message}\n`);
        UI.toast(data.message, 'error');
      }
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

    // Header summary
    const summary = c('div', { className: 'flex gap-3 mb-3', style: { flexWrap: 'wrap' } }, [
      enWhen && c('span', { className: 'badge badge-info' }, `EN scan · ${enWhen} · ${lastResults.en.fresh?.length || 0} новых / ${lastResults.en.filtered?.length || 0} matching`),
      ruWhen && c('span', { className: 'badge badge-info' }, `RU scan · ${ruWhen} · ${lastResults.ru.fresh?.length || 0} новых / ${lastResults.ru.filtered?.length || 0} matching`),
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
    const dynKeywords = window.Skills.extractDynamicKeywords(allRows, { limit: 20 });
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
      resultsEl.appendChild(c('div', { className: 'empty' }, 'Нет совпадений'));
      return;
    }
    const tbody = c('tbody', null, rows.slice(0, 200).map((r) => {
      const wt = r.workplaceType || (r.isRemote ? 'Remote' : 'Onsite');
      const wtClass = /remote/i.test(wt) ? 'badge-ok' : /hybrid/i.test(wt) ? 'badge-info' : '';
      return c('tr', null, [
        c('td', { style: { minWidth: '160px' } }, r.company || '—'),
        c('td', null, c('a', { href: r.url, target: '_blank', rel: 'noopener', style: { color: 'var(--rausch)' } }, r.title)),
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
        `Показаны первые 200 из ${rows.length}.`));
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
        c('p', { className: 'page-subtitle' },
          `EN: ${apiCompanies.length} · RU: hh.ru + Habr Career`),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap', alignItems: 'flex-end' } }, [
        c('div', { className: 'field', style: { flex: 1, marginBottom: 0, minWidth: '220px' } }, [
          c('label', null, t('scan.companyLbl')),
          companySelect,
        ]),
        c('label', { className: 'flex', style: { gap: '8px', userSelect: 'none' } }, [
          dryRun, c('span', null, t('scan.dryRun')),
        ]),
        c('button', { className: 'btn btn-primary', onClick: runScanAll, title: 'Greenhouse + Ashby + Lever + hh.ru + Habr Career' }, '🌐 ' + t('scan.btnAll', 'Scan all')),
        c('button', { className: 'btn btn-ghost', onClick: runEnScan, title: 'Greenhouse / Ashby / Lever only' }, t('scan.btnEn')),
        c('button', { className: 'btn btn-ghost', onClick: runRuScan, title: 'hh.ru + Habr Career only' }, t('scan.btnRu')),
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

    c('div', { className: 'card mt-5' }, [
      c('h3', { style: { marginTop: 0 } }, `${t('scan.activeCo')} ${companies.length}/${apiCompanies.length}`),
      portalsErr
        ? c('div', { className: 'empty' }, [
            c('strong', null, 'Не удалось загрузить portals.yml'),
            c('p', { style: { color: 'var(--foggy)', marginTop: '8px' } }, portalsErr.message),
          ])
        : companies.length === 0
        ? c('div', { className: 'empty' }, 'Все компании отключены (enabled: false).')
        : c('div', { className: 'flex', style: { flexWrap: 'wrap', gap: '8px' } },
            companies.map((co) => {
              const hasApi = apiCompanies.includes(co);
              return c('span', {
                className: 'tag',
                style: {
                  fontSize: '13px',
                  background: hasApi ? 'rgba(0,138,5,.10)' : 'var(--beach)',
                  color: hasApi ? 'var(--kazan)' : 'var(--foggy)',
                },
                title: hasApi ? 'API настроен' : 'websearch only — scanner skip',
              }, (hasApi ? '✓ ' : '○ ') + (co.name || co));
            })
          ),
    ]),
  ]);
});

function appendMeta(el, text) {
  const span = document.createElement('span');
  span.className = 'meta';
  span.textContent = text;
  el.appendChild(span);
  el.scrollTop = el.scrollHeight;
}
