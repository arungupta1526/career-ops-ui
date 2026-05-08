/* global Router, API, UI, I18n */
Router.register('reports', async (params) => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  // single report view
  if (params[0]) {
    const slug = params.join('/');
    const r = await API.get('/api/reports/' + encodeURIComponent(slug));
    return c('div', null, [
      c('header', { className: 'page-header' }, [
        c('div', null, [
          c('h1', { className: 'page-title' }, r.title || slug),
          c('p', { className: 'page-subtitle' }, [r.date, r.archetype, r.legitimacy].filter(Boolean).join(' · ')),
        ]),
        c('div', { className: 'flex gap-3' }, [
          c('button', { className: 'btn btn-ghost', onClick: () => Router.go('/reports') }, t('rep.allReports')),
          r.url && c('a', { className: 'btn btn-ghost', href: r.url, target: '_blank', rel: 'noopener' }, t('rep.openJd')),
        ]),
      ]),
      c('div', { className: 'card md', html: UI.md(r.markdown) }),
    ]);
  }

  // list view
  const data = await API.get('/api/reports');
  const reports = data.reports || [];

  if (reports.length === 0) {
    return c('div', null, [
      c('header', { className: 'page-header' }, [
        c('div', null, [c('h1', { className: 'page-title' }, t('rep.title'))]),
      ]),
      c('div', { className: 'empty' }, t('rep.empty')),
    ]);
  }

  // 12 reports per page → 3 rows × 4-card grid on a wide screen
  const cardsWrap = c('div', { className: 'card-row' });
  const pgWrap = c('div');
  const pager = UI.paginate({ pageSize: 12, onChange: () => render() });

  function makeCard(rep) {
    const cls = rep.scoreNum >= 4 ? 'score-high' : rep.scoreNum >= 3 ? 'score-mid' : 'score-low';
    return c('div', {
      className: 'card',
      style: { cursor: 'pointer' },
      onClick: () => Router.go('/reports/' + rep.slug),
    }, [
      c('div', { className: 'flex-between' }, [
        c('div', null, [
          c('div', { style: { fontWeight: 700, fontSize: '15.5px' } }, rep.title || rep.slug),
          c('div', { className: 'flex gap-1 mt-3' }, [
            rep.date && c('span', { className: 'tag' }, rep.date),
            rep.legitimacy && c('span', { className: 'tag' }, rep.legitimacy),
          ]),
        ]),
        rep.scoreNum != null && c('span', { className: 'score-pill ' + cls }, rep.score),
      ]),
    ]);
  }

  function render() {
    const page = pager.slice(reports);
    cardsWrap.innerHTML = '';
    pgWrap.innerHTML = '';
    page.forEach((rep) => cardsWrap.appendChild(makeCard(rep)));
    pgWrap.appendChild(pager.controls(page.length, reports.length));
  }
  render();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('rep.title')),
        c('p', { className: 'page-subtitle' }, `${reports.length} ${t('rep.inDir')} reports/`),
      ]),
    ]),
    cardsWrap,
    pgWrap,
  ]);
});
