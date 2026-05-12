/* global Router, API, UI, I18n */
Router.register('tracker', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/tracker');
  const rows = data.rows || [];

  const filterStatus = c('select', { className: 'select', style: { maxWidth: '180px' } }, [
    c('option', { value: '' }, t('track.allStatus')),
    ...[...new Set(rows.map((r) => r.status).filter(Boolean))].map((s) => c('option', { value: s }, s)),
  ]);
  const filterScore = c('select', { className: 'select', style: { maxWidth: '180px' } }, [
    c('option', { value: '' }, t('track.anyScore')),
    c('option', { value: '4' }, t('track.scoreHigh')),
    c('option', { value: '3' }, t('track.scoreMid')),
    c('option', { value: '0' }, t('track.scoreLow')),
  ]);
  const filterText = c('input', { className: 'input', placeholder: t('track.search') });

  const tbody = c('tbody');
  const pgWrap = c('div'); // paginator container, re-rendered on each filter change

  // 25 rows per page — same default the activity log uses. The paginator
  // auto-clamps when the filter narrows the list so the user can't land
  // on an empty page after typing in the search.
  const pager = UI.paginate({ pageSize: 25, onChange: () => applyFilters() });

  function filtered() {
    const out = [];
    for (const r of rows) {
      if (filterStatus.value && r.status !== filterStatus.value) continue;
      if (filterScore.value === '4' && (r.scoreNum ?? -1) < 4) continue;
      if (filterScore.value === '3' && (r.scoreNum ?? -1) < 3) continue;
      if (filterScore.value === '0' && (r.scoreNum ?? 0) >= 3) continue;
      const q = filterText.value.toLowerCase().trim();
      if (q && !((r.company + ' ' + r.role).toLowerCase().includes(q))) continue;
      out.push(r);
    }
    return out;
  }

  function applyFilters() {
    const all = filtered();
    const page = pager.slice(all);
    tbody.innerHTML = '';
    pgWrap.innerHTML = '';
    if (all.length === 0) {
      tbody.appendChild(c('tr', null, c('td', { colspan: 8, style: { textAlign: 'center', padding: '40px', color: 'var(--foggy)' } }, t('track.noMatch'))));
      return;
    }
    for (const r of page) tbody.appendChild(row(r));
    pgWrap.appendChild(pager.controls(page.length, all.length));
  }
  // Resetting the pager when filter inputs change keeps page-1 sticky.
  ;[filterStatus, filterScore, filterText].forEach((el) =>
    el.addEventListener('input', () => { pager.reset(); applyFilters(); })
  );
  function row(r) {
    const scoreCls = r.scoreNum >= 4 ? 'score-high' : r.scoreNum >= 3 ? 'score-mid' : 'score-low';
    return c('tr', null, [
      c('td', null, r.num || ''),
      c('td', null, r.date || ''),
      c('td', null, r.company || ''),
      c('td', null, r.role || ''),
      c('td', null, c('span', { className: 'score-pill ' + scoreCls }, r.score || '—')),
      c('td', null, c('span', { className: 'badge ' + statusClass(r.status) }, r.status || '')),
      c('td', null, r.pdfReady ? '✓' : '—'),
      c('td', null, r.reportPath ? c('button', { className: 'btn btn-ghost btn-sm', onClick: () => Router.go('/reports/' + r.reportPath.replace(/^reports\//, '').replace(/\.md$/, '')) }, t('track.report')) : ''),
    ]);
  }

  applyFilters();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('track.title')),
        c('p', { className: 'page-subtitle' }, `${rows.length} ${t('track.entriesIn')} data/applications.md`),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: (e) => runFix(e.currentTarget, '/api/run/normalize', t) }, t('track.normalize')),
        c('button', { className: 'btn btn-ghost', onClick: (e) => runFix(e.currentTarget, '/api/run/dedup', t) }, t('track.dedup')),
        c('button', { className: 'btn btn-ghost', onClick: (e) => runFix(e.currentTarget, '/api/run/merge', t) }, t('track.merge')),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } }, [
        filterStatus, filterScore, filterText,
      ]),
    ]),

    c('div', { className: 'table-wrap' },
      c('table', { className: 'tbl' }, [
        c('thead', null, c('tr', null,
          ['#', t('track.col.date'), t('scan.col.company'), t('scan.col.role'), 'Score', t('track.col.status'), 'PDF', ''].map((h) => c('th', null, h))
        )),
        tbody,
      ])
    ),
    pgWrap,
  ]);
});

async function runFix(btn, path, t) {
  UI.toast(t('track.runStart'));
  try {
    const r = await UI.withSpinner(btn, () => API.post(path));
    UI.toast(t('track.done') + ' · exit ' + r.code, r.code === 0 ? 'success' : 'error');
    UI.modal('Output', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n\n' + r.stderr : '')));
  } catch (e) {
    UI.toast((e && e.message) || 'tracker error', 'error');
  }
}

function statusClass(s) {
  s = (s || '').toLowerCase();
  if (s.includes('offer')) return 'badge-ok';
  if (s.includes('reject') || s.includes('discard')) return 'badge-bad';
  if (s.includes('interview') || s.includes('respond')) return 'badge-info';
  if (s.includes('skip')) return 'badge-warn';
  return '';
}
