/* global Router, API, UI */
Router.register('tracker', async () => {
  const c = UI.el;
  const data = await API.get('/api/tracker');
  const rows = data.rows || [];

  const filterStatus = c('select', { className: 'select', style: { maxWidth: '180px' } }, [
    c('option', { value: '' }, 'все статусы'),
    ...[...new Set(rows.map((r) => r.status).filter(Boolean))].map((s) => c('option', { value: s }, s)),
  ]);
  const filterScore = c('select', { className: 'select', style: { maxWidth: '180px' } }, [
    c('option', { value: '' }, 'любой score'),
    c('option', { value: '4' }, '≥ 4.0'),
    c('option', { value: '3' }, '≥ 3.0'),
    c('option', { value: '0' }, '< 3.0'),
  ]);
  const filterText = c('input', { className: 'input', placeholder: 'Поиск по компании / роли…' });

  const tbody = c('tbody');

  function applyFilters() {
    tbody.innerHTML = '';
    let visible = 0;
    for (const r of rows) {
      if (filterStatus.value && r.status !== filterStatus.value) continue;
      if (filterScore.value === '4' && (r.scoreNum ?? -1) < 4) continue;
      if (filterScore.value === '3' && (r.scoreNum ?? -1) < 3) continue;
      if (filterScore.value === '0' && (r.scoreNum ?? 0) >= 3) continue;
      const q = filterText.value.toLowerCase().trim();
      if (q && !((r.company + ' ' + r.role).toLowerCase().includes(q))) continue;
      tbody.appendChild(row(r));
      visible++;
    }
    if (visible === 0) {
      tbody.appendChild(c('tr', null, c('td', { colspan: 8, style: { textAlign: 'center', padding: '40px', color: 'var(--foggy)' } }, 'Нет совпадений')));
    }
  }
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
      c('td', null, r.reportPath ? c('button', { className: 'btn btn-ghost btn-sm', onClick: () => Router.go('/reports/' + r.reportPath.replace(/^reports\//, '').replace(/\.md$/, '')) }, 'Отчёт') : ''),
    ]);
  }

  ;[filterStatus, filterScore, filterText].forEach((el) => el.addEventListener('input', applyFilters));
  applyFilters();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Трекер заявок'),
        c('p', { className: 'page-subtitle' }, `${rows.length} записей в data/applications.md`),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: () => runFix('/api/run/normalize') }, 'Normalize'),
        c('button', { className: 'btn btn-ghost', onClick: () => runFix('/api/run/dedup') }, 'Dedup'),
        c('button', { className: 'btn btn-ghost', onClick: () => runFix('/api/run/merge') }, 'Merge TSV'),
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
          ['#', 'Дата', 'Компания', 'Роль', 'Score', 'Статус', 'PDF', ''].map((h) => c('th', null, h))
        )),
        tbody,
      ])
    ),
  ]);
});

async function runFix(path) {
  UI.toast('Запускаю…');
  try {
    const r = await API.post(path);
    UI.toast('Готово · exit ' + r.code, r.code === 0 ? 'success' : 'error');
    UI.modal('Output', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n\n' + r.stderr : '')));
  } catch (e) {
    UI.toast(e.message, 'error');
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
