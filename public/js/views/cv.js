/* global Router, API, UI, I18n */
Router.register('cv', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  // F-V54-A (v1.54.1) — a CV markdown's own `# Name` rendered as a
  // SECOND top-level <h1> beside the page-title <h1>CV</h1> (WCAG 1.3.1
  // Info & Relationships / 2.4.6 Headings). Shift every preview heading
  // down one level (h1→h2 … h5→h6, h6→role=heading aria-level=7) so the
  // page keeps exactly one <h1>. Scoped to cv.js on purpose: UI.md is
  // shared by help/reports/deep/evaluate which each manage headings
  // their own way (help strips article h1s + builds its TOC from h2).
  const cvMd = (src) => UI.md(src || '')
    .replace(/<h6\b([^>]*)>/g, '<div role="heading" aria-level="7"$1>')
    .replace(/<\/h6>/g, '</div>')
    .replace(/<h5\b/g, '<h6').replace(/<\/h5>/g, '</h6>')
    .replace(/<h4\b/g, '<h5').replace(/<\/h4>/g, '</h5>')
    .replace(/<h3\b/g, '<h4').replace(/<\/h3>/g, '</h4>')
    .replace(/<h2\b/g, '<h3').replace(/<\/h2>/g, '</h3>')
    .replace(/<h1\b/g, '<h2').replace(/<\/h1>/g, '</h2>');
  const data = await API.get('/api/cv');
  // v1.47.0 (WS2 #16) gave the editor an accessible name via
  // aria-labelledby → the "Markdown" section heading. v1.55.2
  // (F-V55-H / UX-5) upgrades that terse "Markdown" name to a
  // descriptive, self-contained aria-label so a screen-reader user
  // landing on the field hears what it is, not just "Markdown". The
  // visible <h3 id="cv-md-heading">Markdown</h3> stays on screen for
  // sighted users; aria-label takes ARIA precedence over the now-
  // removed aria-labelledby (avoids dead, ignored markup).
  const ta = c('textarea', {
    className: 'textarea', rows: 30, style: { minHeight: '60vh' },
    id: 'cv-editor',
    'aria-label': t('cv.editorAria', 'CV markdown editor — your professional resume in markdown format'),
  }, data.markdown || '');
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

  // Snapshot the latest PDF in the output dir so we can detect what
  // generate-pdf.mjs produced and trigger a browser download for it.
  async function latestPdfName() {
    try {
      const r = await API.get('/api/output/pdfs');
      const files = r.files || [];
      if (!files.length) return null;
      // /api/output/pdfs returns files sorted newest-first.
      return files[0].name;
    } catch { return null; }
  }

  function triggerDownload(name) {
    const a = document.createElement('a');
    a.href = '/api/output/pdfs/' + encodeURIComponent(name);
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function streamPdf(btn) {
    UI.toast(t('cv.pdfRunning', 'Generating PDF…'));
    btn.classList.add('is-loading');
    btn.disabled = true;
    const before = await latestPdfName();
    const lines = [];
    const console_ = c('pre', { className: 'console', style: { maxHeight: '320px', overflow: 'auto' } }, '');
    UI.modal(t('cv.pdfTitle', 'Generate PDF'), console_);
    const es = API.stream('/api/stream/pdf', async (event, data) => {
      if (event === 'log' && data.line) {
        lines.push(data.line);
        console_.textContent = lines.join('\n');
        console_.scrollTop = console_.scrollHeight;
      } else if (event === 'done') {
        lines.push(`✓ done (exit ${data.code})`);
        console_.textContent = lines.join('\n');
        UI.toast(t('cv.pdfDone', 'PDF generated'), 'success');
        await loadPdfList();
        const after = await latestPdfName();
        // Only auto-download if generate-pdf produced a NEW file; otherwise
        // a no-op rerun would silently re-download the same artifact.
        if (after && after !== before) {
          triggerDownload(after);
        }
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
  // Accepts text formats; binary formats (pdf/docx/odt/rtf/doc) POST to
  // /api/cv/import, which delegates to pandoc / pdftotext server-side.
  const fileInput = c('input', {
    type: 'file',
    accept: '.md,.markdown,.txt,.html,.htm,.pdf,.docx,.doc,.odt,.rtf',
    style: { display: 'none' },
    onChange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const sizeKb = (file.size / 1024).toFixed(1);
      UI.toast(t('cv.uploadConverting', 'Converting…') + ` ${file.name} (${sizeKb} KB)`);
      try {
        const buf = await file.arrayBuffer();
        const res = await fetch('/api/cv/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': file.name,
          },
          body: buf,
        });
        let payload;
        try { payload = await res.json(); }
        catch { payload = { ok: false, error: `HTTP ${res.status}` }; }
        if (!res.ok || !payload.ok) {
          const hint = payload.hint ? '\n\n' + payload.hint : '';
          UI.toast((payload.error || 'import failed') + hint, 'error');
          return;
        }
        ta.value = payload.markdown;
        const p = document.getElementById('cv-preview');
        if (p) p.innerHTML = cvMd(payload.markdown);
        UI.toast(t('cv.uploadDone', 'Loaded') +
          ` ${file.name} (${payload.converter}) — ` + t('cv.reviewSave', 'review, then Save'),
          'success');
      } catch (err) {
        UI.toast(err.message || 'upload failed', 'error');
      } finally {
        // Reset the input so re-selecting the same file fires onChange again.
        e.target.value = '';
      }
    },
  });

  const root = c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        // v1.56.0 — UX-9: the page chrome shouldn't shout "CV" louder
        // than the CV itself. Keep exactly ONE <h1> (F-V54-A: cvMd
        // shifts the user's own `# Name` to <h2>, so this stays the
        // page's only <h1>) but render it as a quiet breadcrumb chip
        // so the user's name in the preview owns the visual space.
        // The subtitle moves to a `title` tooltip to cut the noise.
        c('h1', {
          className: 'page-title cv-breadcrumb',
          title: t('cv.subtitle'),
        }, t('cv.title')),
      ]),
      c('div', { className: 'flex gap-3' }, [
        fileInput,
        c('button', {
          className: 'btn btn-ghost',
          onClick: () => fileInput.click(),
          title: t('cv.uploadHint',
            'Upload .md, .txt, .html, .pdf, .docx, .odt, .rtf or .doc — converted server-side, then review and Save.'),
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
        c('h3', { className: 'section-title', id: 'cv-md-heading' }, t('cv.markdown')),
        c('div', { className: 'card', style: { padding: 0 } }, ta),
      ]),
      c('div', null, [
        c('h3', { className: 'section-title' }, t('cv.preview')),
        c('div', { className: 'card md', id: 'cv-preview', html: cvMd(data.markdown || '') }),
      ]),
    ]),

    c('div', { className: 'mt-5' }, pdfBox),
  ]);
  // v1.22.0 (N-2) — was `.also(fn)` via Element.prototype monkey-patch;
  // replaced with a free function so we don't pollute the global DOM
  // prototype (would conflict with any future library defining `.also`).
  ta.addEventListener('input', () => {
    const p = root.querySelector('#cv-preview');
    p.innerHTML = cvMd(ta.value);
  });
  // Lazy-load the PDF list so the page first paint isn't blocked.
  loadPdfList();
  return root;
});
