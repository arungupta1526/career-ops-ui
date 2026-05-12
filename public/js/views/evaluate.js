/* global Router, API, UI, I18n */
Router.register('evaluate', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const prefillUrl = params.get('url') || '';

  const jdInput = c('textarea', {
    className: 'textarea',
    rows: 16,
    placeholder: t('eval.placeholder'),
  });
  const saveJd = c('input', { type: 'checkbox', id: 'save-jd' });
  const out = c('div', { id: 'eval-out' });

  if (prefillUrl) {
    jdInput.value = `URL: ${prefillUrl}\n\n[paste JD text here]`;
  }

  async function run() {
    const jd = jdInput.value.trim();
    if (jd.length < 50) {
      UI.toast(t('eval.shortJd'), 'error');
      return;
    }
    out.innerHTML = `<div class="loading">${t('eval.evaluating')}</div>`;
    try {
      const r = await API.post('/api/evaluate', { jd, save: saveJd.checked });
      renderResult(r);
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, t('common.error') + ': ' + e.message));
    }
  }

  function renderResult(r) {
    out.innerHTML = '';
    if (r.mode === 'manual') {
      out.appendChild(c('div', { className: 'card' }, [
        c('div', { className: 'badge badge-warn mb-3' }, t('eval.manualMode')),
        c('p', null, r.message),
        c('p', { className: 'field-hint' }, t('eval.copyHint')),
        c('pre', { className: 'console' }, r.prompt),
        c('div', { className: 'flex gap-3 mt-3' }, [
          c('button', { className: 'btn btn-primary', onClick: () => {
            navigator.clipboard.writeText(r.prompt);
            UI.toast(t('eval.copied'), 'success');
          }}, t('eval.copy')),
          c('button', {
            className: 'btn btn-ghost',
            onClick: (e) => window.PdfGenerate.run({
              kind: 'inline',
              markdown: r.prompt,
              title: 'JD evaluation prompt',
              slug: 'evaluate',
              button: e.currentTarget,
            }),
          }, '📄 ' + t('common.generatePdf', 'Generate PDF')),
        ]),
      ]));
    } else {
      const cls = r.code === 0 ? 'badge-ok' : 'badge-bad';
      const engineName = r.mode === 'anthropic' ? 'Anthropic' : 'Gemini';
      // For live runs the markdown lives in either `markdown` (Anthropic)
      // or `stdout` (Gemini). PDF button uses whichever is non-empty.
      const liveMd = r.markdown || r.stdout || '';
      out.appendChild(c('div', { className: 'card' }, [
        c('div', { className: 'flex-between mb-3' }, [
          c('div', { className: 'flex gap-3' }, [
            c('div', { className: 'badge ' + cls },
              engineName + ' · ' + t('eval.exit', 'exit') + ' ' + (r.code ?? 0)),
            r.saved && c('div', { className: 'badge badge-info' },
              t('eval.savedAs', 'Saved') + ': ' + r.saved),
          ]),
          liveMd && c('button', {
            className: 'btn btn-primary',
            onClick: (e) => window.PdfGenerate.run({
              kind: 'inline',
              markdown: liveMd,
              title: `JD evaluation (${engineName})`,
              slug: 'evaluate',
              button: e.currentTarget,
            }),
          }, '📄 ' + t('common.generatePdf', 'Generate PDF')),
        ]),
        (r.markdown || r.stdout) && c('div', { className: 'md', html: UI.md(r.markdown || r.stdout) }),
        r.stderr && c('details', null, [
          c('summary', null, 'stderr'),
          c('pre', { className: 'console' }, r.stderr),
        ]),
      ]));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('eval.title')),
        c('p', { className: 'page-subtitle' }, t('eval.subtitle')),
      ]),
    ]),

    c('div', { className: 'card' }, [
      c('div', { className: 'field' }, [
        c('label', null, t('eval.jdLbl')),
        jdInput,
      ]),
      c('label', { className: 'flex', style: { gap: '8px', userSelect: 'none' } }, [
        saveJd, c('span', null, t('eval.saveJd')),
      ]),
      c('div', { className: 'flex gap-3 mt-3' }, [
        c('button', { className: 'btn btn-primary', onClick: run }, t('eval.btnEval')),
        c('button', { className: 'btn btn-ghost', onClick: () => { jdInput.value = ''; out.innerHTML = ''; } }, t('eval.btnClear')),
      ]),
    ]),

    c('div', { className: 'mt-5' }, out),
  ]);
});
