/* global Router, API, UI, I18n */
Router.register('health', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/health');

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('health.title')),
        c('p', { className: 'page-subtitle' }, `career-ops v${data.version}`),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: async (e) => {
          UI.toast(t('health.runningDoctor', 'Running doctor.mjs…'));
          const r = await UI.withSpinner(e.currentTarget, () => API.post('/api/run/doctor'));
          UI.modal('doctor', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, t('health.runDoctor')),
        c('button', { className: 'btn btn-ghost', onClick: async (e) => {
          UI.toast(t('health.runningVerify', 'Running verify-pipeline.mjs…'));
          const r = await UI.withSpinner(e.currentTarget, () => API.post('/api/run/verify'));
          UI.modal('verify', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, t('health.verify')),
      ]),
    ]),

    // WS2 #36 — a flat run of generic divs gave SR users no name↔status
    // relationship. Render as a list; the badge carries an aria-label
    // pairing the check name with its pass/fail state.
    c('ul', { className: 'card-row', role: 'list', style: { listStyle: 'none', margin: 0, padding: 0 } },
      data.checks.map((ch) => {
        let badgeClass, badgeText;
        if (ch.ok) {
          badgeClass = 'badge-ok'; badgeText = t('health.badgeOk');
        } else if (ch.required === false) {
          badgeClass = 'badge-warn'; badgeText = t('health.badgeOptional');
        } else {
          badgeClass = 'badge-bad'; badgeText = t('health.badgeFail');
        }
        return c('li', { className: 'card' }, [
          c('div', { className: 'flex-between' }, [
            c('div', null, [
              c('div', { className: 'metric-label' }, ch.name),
              ch.value && c('div', { style: { fontSize: '13px', color: 'var(--foggy)', marginTop: '6px', wordBreak: 'break-all' } }, ch.value),
            ]),
            c('span', { className: 'badge ' + badgeClass, 'aria-label': ch.name + ': ' + badgeText }, badgeText),
          ]),
        ]);
      })
    ),
  ]);
});
