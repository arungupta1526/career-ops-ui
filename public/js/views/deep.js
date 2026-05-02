/* global Router, API, UI, I18n */
Router.register('deep', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const company = c('input', { className: 'input', placeholder: t('deep.companyExample') });
  const role = c('input', { className: 'input', placeholder: t('deep.roleExample') });
  const out = c('div');

  async function run() {
    if (!company.value.trim()) return UI.toast(t('deep.enterCompany'), 'error');
    out.innerHTML = `<div class="loading">${t('deep.generating')}</div>`;
    try {
      const r = await API.post('/api/deep', {
        company: company.value.trim(),
        role: role.value.trim() || undefined,
      });
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'card' }, [
        c('p', null, r.message),
        c('pre', { className: 'console' }, r.prompt),
        c('div', { className: 'flex gap-3 mt-3' }, [
          c('button', { className: 'btn btn-primary', onClick: () => {
            navigator.clipboard.writeText(r.prompt);
            UI.toast(t('eval.copied'), 'success');
          }}, t('eval.copy')),
        ]),
      ]));
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, e.message));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('deep.title')),
        c('p', { className: 'page-subtitle' }, t('deep.subtitle')),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'row' }, [
        c('div', { className: 'field' }, [c('label', null, t('deep.companyLbl')), company]),
        c('div', { className: 'field' }, [c('label', null, t('deep.roleLbl')), role]),
      ]),
      c('button', { className: 'btn btn-primary', onClick: run }, t('deep.run')),
    ]),
    c('div', { className: 'mt-5' }, out),
  ]);
});
