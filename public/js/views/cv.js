/* global Router, API, UI */
Router.register('cv', async () => {
  const c = UI.el;
  const data = await API.get('/api/cv');
  const ta = c('textarea', { className: 'textarea', rows: 30, style: { minHeight: '60vh' } }, data.markdown || '');

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, 'CV'),
        c('p', { className: 'page-subtitle' }, 'Источник истины для оценки. Все скрипты читают cv.md.'),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', { className: 'btn btn-ghost', onClick: async () => {
          UI.toast('Запускаю sync-check…');
          const r = await API.post('/api/run/sync-check');
          UI.modal('sync-check', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, 'sync-check'),
        c('button', { className: 'btn btn-primary', onClick: async () => {
          await API.put('/api/cv', { markdown: ta.value });
          UI.toast('Сохранено', 'success');
        }}, '💾 Сохранить'),
      ]),
    ]),

    c('div', { className: 'grid-2' }, [
      c('div', null, [
        c('h3', { className: 'section-title' }, 'Markdown'),
        c('div', { className: 'card', style: { padding: 0 } }, ta),
      ]),
      c('div', null, [
        c('h3', { className: 'section-title' }, 'Превью'),
        c('div', { className: 'card md', id: 'cv-preview', html: UI.md(data.markdown || '') }),
      ]),
    ]),
  ]).also((root) => {
    ta.addEventListener('input', () => {
      const p = root.querySelector('#cv-preview');
      p.innerHTML = UI.md(ta.value);
    });
  });
});

// Tiny chainable .also helper
Element.prototype.also = function (fn) { fn(this); return this; };
