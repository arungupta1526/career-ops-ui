/* global Router, API, UI, I18n */
Router.register('cv', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/cv');
  const ta = c('textarea', { className: 'textarea', rows: 30, style: { minHeight: '60vh' } }, data.markdown || '');

  // Hidden file input — we'll click() it from the visible "Upload CV" button.
  const fileInput = c('input', {
    type: 'file',
    accept: '.md,.markdown,.txt,.html',
    style: { display: 'none' },
    onChange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      ta.value = text;
      const p = document.getElementById('cv-preview');
      if (p) p.innerHTML = UI.md(text);
      UI.toast(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB) — review then Save`, 'success');
    },
  });

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('cv.title')),
        c('p', { className: 'page-subtitle' }, t('cv.subtitle')),
      ]),
      c('div', { className: 'flex gap-3' }, [
        fileInput,
        c('button', {
          className: 'btn btn-ghost',
          onClick: () => fileInput.click(),
          title: 'Load CV from a local .md / .txt file (still requires Save afterwards)',
        }, '📁 ' + t('cv.upload', 'Upload CV')),
        c('button', { className: 'btn btn-ghost', onClick: async () => {
          UI.toast('sync-check…');
          const r = await API.post('/api/run/sync-check');
          UI.modal('sync-check', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, 'sync-check'),
        c('button', { className: 'btn btn-primary', onClick: async () => {
          if (!ta.value.trim()) {
            UI.toast('CV is empty', 'error');
            return;
          }
          await API.put('/api/cv', { markdown: ta.value });
          UI.toast(t('cv.saved', 'Saved'), 'success');
        }}, '💾 ' + t('common.save')),
      ]),
    ]),

    c('div', { className: 'grid-2' }, [
      c('div', null, [
        c('h3', { className: 'section-title' }, t('cv.markdown')),
        c('div', { className: 'card', style: { padding: 0 } }, ta),
      ]),
      c('div', null, [
        c('h3', { className: 'section-title' }, t('cv.preview')),
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

// Tiny chainable .also helper (declared once for the app)
if (!Element.prototype.also) {
  Element.prototype.also = function (fn) { fn(this); return this; };
}
