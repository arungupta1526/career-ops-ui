/* global Router, API, UI */
Router.register('health', async () => {
  const c = UI.el;
  const data = await API.get('/api/health');

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'Health'),
        c('p', { className: 'page-subtitle' }, `career-ops v${data.version}`),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: async () => {
          UI.toast('doctor.mjs…');
          const r = await API.post('/api/run/doctor');
          UI.modal('doctor', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, 'Run doctor'),
        c('button', { className: 'btn btn-ghost', onClick: async () => {
          UI.toast('verify-pipeline.mjs…');
          const r = await API.post('/api/run/verify');
          UI.modal('verify', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, 'Verify pipeline'),
      ]),
    ]),

    c('div', { className: 'card-row' },
      data.checks.map((ch) => {
        let badgeClass, badgeText;
        if (ch.ok) {
          badgeClass = 'badge-ok'; badgeText = 'OK';
        } else if (ch.required === false) {
          badgeClass = 'badge-warn'; badgeText = 'OPTIONAL';
        } else {
          badgeClass = 'badge-bad'; badgeText = 'FAIL';
        }
        return c('div', { className: 'card' }, [
          c('div', { className: 'flex-between' }, [
            c('div', null, [
              c('div', { className: 'metric-label' }, ch.name),
              ch.value && c('div', { style: { fontSize: '13px', color: 'var(--foggy)', marginTop: '6px', wordBreak: 'break-all' } }, ch.value),
            ]),
            c('span', { className: 'badge ' + badgeClass }, badgeText),
          ]),
        ]);
      })
    ),
  ]);
});
