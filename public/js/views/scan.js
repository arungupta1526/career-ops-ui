/* global Router, API, UI */
Router.register('scan', async () => {
  const c = UI.el;
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

  const consoleEl = c('pre', { className: 'console', id: 'scan-console' }, '> ready. press «запустить scan».');
  const resultsEl = c('div', { id: 'scan-results' });

  const dryRun = c('input', { type: 'checkbox', id: 'dry-run' });
  const filterText = c('input', { className: 'input', placeholder: 'фильтр по компании / роли / локации…', style: { maxWidth: '320px' } });
  const filterRemote = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: '' }, 'все типы'),
    c('option', { value: 'remote' }, 'только remote'),
    c('option', { value: 'hybrid' }, 'hybrid'),
    c('option', { value: 'reloc' }, 'релокация'),
  ]);
  const filterSource = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: '' }, 'все источники'),
    c('option', { value: 'greenhouse' }, 'Greenhouse'),
    c('option', { value: 'ashby' }, 'Ashby'),
    c('option', { value: 'lever' }, 'Lever'),
    c('option', { value: 'hh.ru' }, 'hh.ru'),
    c('option', { value: 'habr-career' }, 'Habr'),
  ]);
  const filterScope = c('select', { className: 'select', style: { maxWidth: '160px' } }, [
    c('option', { value: 'all' }, 'все matching'),
    c('option', { value: 'fresh' }, 'только новые'),
  ]);

  const companySelect = c('select', { className: 'select', id: 'company-select' }, [
    c('option', { value: '' }, 'все компании'),
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

  // Render the rich table of last-scan results
  let lastResults = { en: null, ru: null };

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
      resultsEl.appendChild(
        c('div', { className: 'empty' },
          'Нет результатов. Запустите EN или RU scan выше — после завершения таблица появится здесь.'
        )
      );
      return;
    }
    const q = (filterText.value || '').toLowerCase().trim();
    const fr = filterRemote.value;
    const fs = filterSource.value;
    const rows = allRows.filter((r) => {
      if (q && !((r.company + ' ' + r.title + ' ' + (r.location || '')).toLowerCase().includes(q))) return false;
      if (fr === 'remote' && !r.isRemote) return false;
      if (fr === 'hybrid' && !/hybrid/i.test(r.workplaceType || '')) return false;
      if (fr === 'reloc' && !r.relocates) return false;
      if (fs && r.source !== fs) return false;
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
          ['Компания', 'Роль', 'Локация', 'Тип', 'Reloc', 'Зарплата', 'Источник'].map((h) => c('th', null, h))
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

  // load results on first render
  refreshResults();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Поиск вакансий'),
        c('p', { className: 'page-subtitle' },
          `EN: ${apiCompanies.length} компаний с API · RU: hh.ru + Habr Career`),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap', alignItems: 'flex-end' } }, [
        c('div', { className: 'field', style: { flex: 1, marginBottom: 0, minWidth: '220px' } }, [
          c('label', null, 'Компания (для EN, опционально)'),
          companySelect,
        ]),
        c('label', { className: 'flex', style: { gap: '8px', userSelect: 'none' } }, [
          dryRun, c('span', null, 'Dry run (без записи)'),
        ]),
        c('button', { className: 'btn btn-primary', onClick: runEnScan, title: 'Greenhouse / Ashby / Lever' }, '🌍 EN scan'),
        c('button', { className: 'btn btn-dark', onClick: runRuScan, title: 'hh.ru + Habr Career' }, '🇷🇺 RU scan'),
        c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/pipeline') }, 'Pipeline'),
      ]),
      c('p', { className: 'field-hint', style: { margin: '12px 0 0' } },
        `EN: ${apiCompanies.length} enabled-компаний с structured API (Greenhouse/Ashby/Lever). ` +
        'RU: hh.ru + Habr Career по ключевым словам из portals.yml. ' +
        'hh.ru вне РФ возвращает 403 — это окей, Habr подхватит.'),
    ]),

    c('div', null, consoleEl),

    c('section', { className: 'section' }, [
      c('div', { className: 'flex-between mb-3', style: { flexWrap: 'wrap', gap: '12px' } }, [
        c('h2', { className: 'section-title', style: { margin: 0 } }, 'Найденные вакансии'),
        c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } },
          [filterScope, filterText, filterRemote, filterSource]),
      ]),
      resultsEl,
    ]),

    c('div', { className: 'card mt-5' }, [
      c('h3', { style: { marginTop: 0 } }, `Активные компании ${companies.length}/${apiCompanies.length} с API`),
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
