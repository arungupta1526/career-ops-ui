/* global Router, API, UI, I18n */
Router.register('apply', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const url = c('input', { className: 'input', placeholder: 'https://...' });
  const jd = c('textarea', { className: 'textarea', rows: 10, placeholder: t('apply.jdLbl') });
  const out = c('div');

  async function run() {
    if (!url.value.trim()) return UI.toast(t('apply.enterUrl'), 'error');
    out.innerHTML = `<div class="loading">…</div>`;
    try {
      const r = await API.post('/api/apply-helper', { url: url.value.trim(), jd: jd.value.trim() });
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'card' }, [
        c('p', null, r.message),
        c('pre', { className: 'console' }, r.checklist),
      ]));
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, e.message));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('apply.title')),
        c('p', { className: 'page-subtitle' }, t('apply.subtitle')),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'field' }, [c('label', null, t('apply.urlLbl')), url]),
      c('div', { className: 'field' }, [c('label', null, t('apply.jdLbl')), jd]),
      c('button', { className: 'btn btn-primary', onClick: run }, t('apply.run')),
    ]),
    c('div', { className: 'mt-5' }, out),
  ]);
});
