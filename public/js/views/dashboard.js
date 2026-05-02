/* global Router, API, UI */
Router.register('dashboard', async () => {
  const data = await API.get('/api/dashboard');
  const c = UI.el;

  function scoreClass(n) {
    if (n == null) return '';
    if (n >= 4.0) return 'score-high';
    if (n >= 3.0) return 'score-mid';
    return 'score-low';
  }

  const root = c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Командный центр'),
        c('p', { className: 'page-subtitle' }, 'Все вакансии, отчёты и активные процессы — в одном месте.'),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/pipeline') }, 'Открыть Pipeline'),
        c('button', { className: 'btn btn-primary', onClick: () => Router.go('/evaluate') }, 'Оценить вакансию'),
      ]),
    ]),

    // metrics
    c('div', { className: 'card-row' }, [
      metric('Заявки', data.counts.applications, 'трекер'),
      metric('Pipeline', data.counts.pipeline, 'ожидают обработки'),
      metric('Отчёты', data.counts.reports, 'сгенерировано'),
      metric('Средний score', data.avgScore ?? '—', '/ 5.0', scoreClass(data.avgScore)),
    ]),

    // by status
    c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, 'Статусы заявок'),
      c('div', { className: 'card' },
        c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } },
          Object.entries(data.byStatus).length === 0
            ? [c('div', { className: 'empty', style: { width: '100%' } }, 'Заявок пока нет — добавьте URL в Pipeline.')]
            : Object.entries(data.byStatus).map(([s, n]) =>
                c('div', { className: 'badge ' + statusClass(s) }, `${s} · ${n}`)
              )
        )
      ),
    ]),

    c('div', { className: 'grid-2 section' }, [
      // recent
      c('div', null, [
        c('h2', { className: 'section-title' }, 'Последние заявки'),
        recentTable(data.recent, scoreClass),
      ]),
      // pipeline
      c('div', null, [
        c('h2', { className: 'section-title' }, 'Pipeline'),
        pipelineCard(data.pipeline),
      ]),
    ]),

    data.lastReport && c('section', { className: 'section' }, [
      c('h2', { className: 'section-title' }, 'Последний отчёт'),
      c('div', { className: 'card' }, [
        c('div', { className: 'flex-between' }, [
          c('div', null, [
            c('div', { style: { fontWeight: 700, fontSize: '17px' } }, data.lastReport.title || data.lastReport.slug),
            c('div', { className: 'flex gap-1', style: { marginTop: '6px' } }, [
              c('span', { className: 'tag' }, data.lastReport.date || ''),
              data.lastReport.legitimacy && c('span', { className: 'tag' }, data.lastReport.legitimacy),
              data.lastReport.scoreNum != null && c('span', { className: 'score-pill ' + scoreClass(data.lastReport.scoreNum) }, data.lastReport.score),
            ]),
          ]),
          c('button', { className: 'btn btn-ghost btn-sm', onClick: () => Router.go('/reports/' + data.lastReport.slug) }, 'Открыть →'),
        ]),
      ]),
    ]),
  ]);

  return root;
});

function metric(label, value, sub, cls) {
  const c = UI.el;
  return c('div', { className: 'card metric-card' }, [
    c('div', { className: 'metric-label' }, label),
    c('div', { className: 'metric-value ' + (cls || '') }, String(value)),
    c('div', { className: 'metric-sub' }, sub),
  ]);
}

function recentTable(rows, scoreClass) {
  const c = UI.el;
  if (!rows.length) {
    return c('div', { className: 'empty' }, 'Заявок ещё нет.');
  }
  const tbody = c('tbody', null,
    rows.map((r) => c('tr', null, [
      c('td', null, r.company || ''),
      c('td', null, r.role || ''),
      c('td', null,
        c('span', { className: 'score-pill ' + scoreClass(r.scoreNum) }, r.score || '—')
      ),
      c('td', null, c('span', { className: 'badge ' + statusClass(r.status) }, r.status || '')),
      c('td', null, r.date || ''),
    ]))
  );
  return c('div', { className: 'table-wrap' },
    c('table', { className: 'tbl' }, [
      c('thead', null, c('tr', null,
        ['Компания', 'Роль', 'Score', 'Статус', 'Дата'].map((h) => c('th', null, h))
      )),
      tbody,
    ])
  );
}

function pipelineCard(urls) {
  const c = UI.el;
  if (!urls.length) {
    return c('div', { className: 'empty' }, 'Pipeline пуст. Добавьте URL во вкладке Pipeline.');
  }
  return c('div', { className: 'card' },
    c('div', { className: 'flex', style: { flexDirection: 'column', alignItems: 'stretch', gap: '8px' } },
      urls.map((u) =>
        c('a', { href: u, target: '_blank', rel: 'noopener', className: 'tag', style: { padding: '8px 12px', fontSize: '13px', wordBreak: 'break-all' } }, u)
      )
    )
  );
}

function statusClass(s) {
  s = (s || '').toLowerCase();
  if (s.includes('offer')) return 'badge-ok';
  if (s.includes('reject') || s.includes('discard')) return 'badge-bad';
  if (s.includes('interview') || s.includes('respond')) return 'badge-info';
  if (s.includes('skip')) return 'badge-warn';
  return '';
}
