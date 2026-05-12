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
    c('div', {
      className: 'card mb-3',
      style: { background: '#eef5ff', borderColor: '#9bb6e0', color: '#1f3b6e' },
    }, [
      c('strong', null, 'ℹ ' + t('apply.bannerTitle', 'Checklist only')),
      c('p', { style: { margin: '6px 0 0', fontSize: '14px' } },
        t('apply.bannerBody', 'This page generates a checklist + paste-ready text. Real Playwright form-fill (with a final-confirm) lives in Claude Code: /career-ops apply <url>')),
      c('p', { style: { margin: '6px 0 0', fontSize: '13px' } }, [
        // PR-9: surface the canonical Playwright setup guide so users
        // who hit a "browser not installed" error in the CLI have an
        // exact, vendor-blessed install path.
        t('apply.playwrightHint', 'Need Playwright? See '),
        c('a', {
          href: 'https://career-ops.org/docs/introduction/guides/set-up-playwright',
          target: '_blank', rel: 'noopener noreferrer',
        }, 'career-ops.org/docs/.../set-up-playwright'),
        ' · ',
        c('a', {
          href: 'https://career-ops.org/docs/introduction/guides/apply-for-a-job',
          target: '_blank', rel: 'noopener noreferrer',
        }, t('apply.docsLink', 'Apply guide')),
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
