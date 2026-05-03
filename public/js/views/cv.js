/* global Router, API, UI, I18n */
Router.register('cv', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const data = await API.get('/api/cv');
  const ta = c('textarea', { className: 'textarea', rows: 30, style: { minHeight: '60vh' } }, data.markdown || '');
  const pdfBox = c('div');

  async function loadPdfList() {
    pdfBox.innerHTML = '';
    let files = [];
    try {
      const r = await API.get('/api/output/pdfs');
      files = r.files || [];
    } catch {}
    if (!files.length) return;
    pdfBox.appendChild(c('h3', { className: 'section-title' }, t('cv.pdfTitle', 'Generated PDFs')));
    const list = c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } });
    for (const f of files) {
      const url = '/api/output/pdfs/' + encodeURIComponent(f.name);
      list.appendChild(c('div', { className: 'card', style: { padding: '12px 16px', minWidth: '260px' } }, [
        c('div', { style: { fontWeight: 600, marginBottom: '4px' } }, f.name),
        c('div', { style: { color: 'var(--foggy)', fontSize: '12px', marginBottom: '8px' } },
          `${(f.size / 1024).toFixed(1)} KB · ${new Date(f.mtime).toLocaleString()}`),
        c('div', { className: 'flex gap-3' }, [
          c('a', { className: 'btn btn-ghost btn-sm', href: url, target: '_blank', rel: 'noopener' }, '↗ ' + t('cv.openPdf', 'Open')),
          c('a', { className: 'btn btn-primary btn-sm', href: url, download: f.name }, '⬇ ' + t('cv.downloadPdf', 'Download')),
        ]),
      ]));
    }
    pdfBox.appendChild(list);
  }

  function streamPdf(btn) {
    UI.toast(t('cv.pdfRunning', 'Generating PDF…'));
    btn.classList.add('is-loading');
    btn.disabled = true;
    const lines = [];
    const console_ = c('pre', { className: 'console', style: { maxHeight: '320px', overflow: 'auto' } }, '');
    UI.modal(t('cv.pdfTitle', 'Generate PDF'), console_);
    const es = API.stream('/api/stream/pdf', (event, data) => {
      if (event === 'log' && data.line) {
        lines.push(data.line);
        console_.textContent = lines.join('\n');
        console_.scrollTop = console_.scrollHeight;
      } else if (event === 'done') {
        lines.push(`✓ done (exit ${data.code})`);
        console_.textContent = lines.join('\n');
        UI.toast(t('cv.pdfDone', 'PDF generated'), 'success');
        loadPdfList();
        btn.classList.remove('is-loading');
        btn.disabled = false;
      } else if (event === 'error') {
        const hint = /ERR_MODULE_NOT_FOUND|playwright/i.test(data.message || '')
          ? '\n\n' + t('cv.pdfNeedsPlaywright', 'Playwright is missing. Run in the parent project:\n  cd "$CAREER_OPS_ROOT" && npm install && npx playwright install chromium')
          : '';
        lines.push('✗ ' + (data.message || 'error') + hint);
        console_.textContent = lines.join('\n');
        UI.toast(data.message || 'error', 'error');
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
    return es;
  }

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
        c('button', { className: 'btn btn-ghost', onClick: async (e) => {
          UI.toast('sync-check…');
          const r = await UI.withSpinner(e.currentTarget, () => API.post('/api/run/sync-check'));
          UI.modal('sync-check', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
        }}, 'sync-check'),
        c('button', {
          className: 'btn btn-ghost',
          onClick: (e) => streamPdf(e.currentTarget),
          title: t('cv.pdfHint', 'Run generate-pdf.mjs and save into output/'),
        }, '📄 ' + t('cv.generatePdf', 'Generate PDF')),
        c('button', { className: 'btn btn-primary', onClick: async (e) => {
          if (!ta.value.trim()) {
            UI.toast('CV is empty', 'error');
            return;
          }
          await UI.withSpinner(e.currentTarget, () => API.put('/api/cv', { markdown: ta.value }));
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

    c('div', { className: 'mt-5' }, pdfBox),
  ]).also((root) => {
    ta.addEventListener('input', () => {
      const p = root.querySelector('#cv-preview');
      p.innerHTML = UI.md(ta.value);
    });
    // Lazy-load the PDF list so the page first paint isn't blocked.
    loadPdfList();
  });
});

// Tiny chainable .also helper (declared once for the app)
if (!Element.prototype.also) {
  Element.prototype.also = function (fn) { fn(this); return this; };
}
