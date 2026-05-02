/* global Router, API, UI */
Router.register('apply', async () => {
  const c = UI.el;
  const url = c('input', { className: 'input', placeholder: 'https://...' });
  const jd = c('textarea', { className: 'textarea', rows: 10, placeholder: 'JD (опционально, поможет персонализации ответов)' });
  const out = c('div');

  async function run() {
    if (!url.value.trim()) return UI.toast('Введите URL', 'error');
    out.innerHTML = '<div class="loading">…</div>';
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
        c('h1', { className: 'page-title' }, 'Apply helper'),
        c('p', { className: 'page-subtitle' }, 'Чек-лист подачи заявки. Реальное автозаполнение — через /career-ops apply в Claude Code (Playwright).'),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'field' }, [c('label', null, 'URL вакансии'), url]),
      c('div', { className: 'field' }, [c('label', null, 'JD (опционально)'), jd]),
      c('button', { className: 'btn btn-primary', onClick: run }, '▶ Сформировать чек-лист'),
    ]),
    c('div', { className: 'mt-5' }, out),
  ]);
});
