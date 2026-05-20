/* global Router, API, UI, I18n */
Router.register('deep', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  const company = c('input', { className: 'input', id: 'deep-company', placeholder: t('deep.companyExample') });
  const role = c('input', { className: 'input', id: 'deep-role', placeholder: t('deep.roleExample') });
  const out = c('div');
  const archive = c('div');
  let liveAvailable = false;
  let liveEngine = '';

  // Probe whether Gemini OR Anthropic is wired up so we know whether to
  // show "Run live" alongside "Copy prompt" or only the manual flow.
  // Anthropic preferred (better at structured deep-research output).
  try {
    const h = await API.get('/api/health');
    const anth = h.checks?.find((x) => x.name === 'ANTHROPIC_API_KEY')?.ok === true;
    const gem = h.checks?.find((x) => x.name === 'GEMINI_API_KEY')?.ok === true;
    if (anth) { liveAvailable = true; liveEngine = 'Anthropic'; }
    else if (gem) { liveAvailable = true; liveEngine = 'Gemini'; }
  } catch {
    liveAvailable = false;
  }

  function renderArchive(files) {
    archive.innerHTML = '';
    if (!files.length) {
      archive.appendChild(c('p', { style: { color: 'var(--foggy)', fontSize: '13px' } }, t('deep.archiveEmpty', 'No saved deep-research files yet.')));
      return;
    }
    archive.appendChild(c('h3', { className: 'section-title' }, t('deep.archiveTitle', 'Saved research')));
    const list = c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap' } });
    for (const f of files) {
      // M-4 (v1.58.11) — saved-research card title↔date spacing.
      // The pre-fix layout was two <span>s with an inline marginLeft:
      // 8px on the second; on some cards the title ran straight into
      // the date (e.g. "software-engineer-generaltoday"). The fix uses
      // a dedicated `.saved-card` flex container with CSS `gap`, plus a
      // semantic <time> element with a datetime attribute (a11y +
      // machine-parseable; matches the WCAG `<time>` recommendation).
      // Spacing comes from `gap`, not from string concatenation or an
      // inline margin that some reset / flex-shrink path could collapse.
      const iso = new Date(f.mtime).toISOString();
      const btn = c('button', {
        className: 'btn btn-ghost btn-sm saved-card',
        title: new Date(f.mtime).toLocaleString(),
        onClick: async (e) => {
          const r = await UI.withSpinner(e.currentTarget, () => API.get('/api/interview-prep/' + encodeURIComponent(f.name)));
          showResult(f.name, r.markdown, { saved: f.name });
        },
      }, [
        c('span', { className: 'saved-card__title' }, f.name.replace(/\.md$/, '')),
        c('time', { className: 'saved-card__date', datetime: iso }, formatRelative(f.mtime)),
      ]);
      list.appendChild(btn);
    }
    archive.appendChild(list);
  }

  async function loadArchive() {
    try {
      const r = await API.get('/api/interview-prep');
      renderArchive(r.files || []);
    } catch {
      renderArchive([]);
    }
  }

  // I-2 (v1.58.17) — relative-time labels were hardcoded English
  // (`today` / `1d ago` / `Nd ago`) on every locale. Use the platform
  // Intl.RelativeTimeFormat with `numeric: 'auto'` so today/yesterday
  // are localized to the active SPA language (сегодня/вчера, 今日/昨日,
  // etc.). For dates older than a week we fall back to a localized
  // absolute date via Intl.DateTimeFormat.
  function formatRelative(iso) {
    const d = new Date(iso);
    const days = Math.round((d.getTime() - Date.now()) / 86400000); // negative = past
    const locale = (window.I18n && I18n.getLang && I18n.getLang()) || 'en';
    try {
      if (Math.abs(days) < 7) {
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
      }
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
    } catch {
      // Defensive fallback for environments without Intl (very old browsers).
      if (days >= 0) return 'today';
      if (days === -1) return '1d ago';
      if (days > -30) return Math.abs(days) + 'd ago';
      return d.toLocaleDateString();
    }
  }

  function showResult(title, markdown, opts = {}) {
    out.innerHTML = '';
    const card = c('div', { className: 'card' });
    const header = c('div', { className: 'flex-between mb-3' }, [
      c('strong', null, title),
      c('div', { className: 'flex gap-3' }, [
        c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            navigator.clipboard.writeText(markdown);
            UI.toast(t('eval.copied', 'Copied'), 'success');
          },
        }, '📋 ' + t('eval.copy', 'Copy')),
        c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (opts.saved || (title || 'deep') + '.md').replace(/[^\w.-]/g, '_');
            a.click();
            URL.revokeObjectURL(a.href);
          },
        }, '⬇ ' + t('deep.download', 'Download .md')),
        opts.saved ? c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            window.open('/api/interview-prep/' + encodeURIComponent(opts.saved), '_blank');
          },
        }, '↗ ' + t('deep.openTab', 'Open in tab')) : null,
        c('button', {
          className: 'btn btn-primary btn-sm',
          onClick: (e) => {
            if (opts.saved) {
              // We have a persisted interview-prep file — use the dedicated
              // endpoint so the PDF metadata reflects the real filename.
              window.PdfGenerate.run({ kind: 'deep', name: opts.saved, button: e.currentTarget });
            } else {
              window.PdfGenerate.run({
                kind: 'inline', markdown, title, slug: 'deep', button: e.currentTarget,
              });
            }
          },
        }, '📄 ' + t('common.generatePdf', 'Generate PDF')),
      ]),
    ]);
    const body = c('div', { className: 'card md', html: UI.md(markdown || '') });
    card.append(header, body);
    out.appendChild(card);
  }

  function showPrompt(prompt, message) {
    out.innerHTML = '';
    out.appendChild(c('div', { className: 'card' }, [
      c('p', { style: { color: 'var(--foggy)' } }, message || ''),
      c('pre', { className: 'console' }, prompt),
      c('div', { className: 'flex gap-3 mt-3' }, [
        c('button', { className: 'btn btn-primary', onClick: () => {
          navigator.clipboard.writeText(prompt);
          UI.toast(t('eval.copied', 'Copied'), 'success');
        }}, '📋 ' + t('eval.copy', 'Copy prompt')),
        // Re-submits the same form with run:true so users who hit
        // "Generate prompt" first can still get the LLM result inline
        // without retyping. Surfaces a clear error toast when no API
        // key is set.
        c('button', {
          className: 'btn btn-ghost',
          onClick: async (e) => {
            if (!liveAvailable) {
              UI.toast(t('deep.needKey', 'Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first'), 'error');
              return;
            }
            await runLive(e.currentTarget);
          },
        }, '⚡ ' + t('deep.showResult', 'Show result')),
      ]),
      // v1.56.0 — UX-10: honest cost ballpark before the live run.
      UI.providerCostHint(t),
    ]));
  }

  async function runLive(btn) {
    if (!company.value.trim()) return UI.toast(t('deep.enterCompany'), 'error');
    out.innerHTML = `<div class="loading">${t('deep.generating')}</div>`;
    try {
      const r = await UI.withSpinner(btn, () => API.post('/api/deep', {
        company: company.value.trim(),
        role: role.value.trim() || undefined,
        run: true,
      }));
      if (r.markdown) {
        showResult(`${company.value.trim()}${role.value.trim() ? ' — ' + role.value.trim() : ''}`, r.markdown, { saved: r.saved });
        loadArchive();
      } else {
        showPrompt(r.prompt, t('deep.geminiNoOutput', 'Gemini returned no output. Showing the prompt — paste it into Claude Code instead.'));
      }
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, e.message));
    }
  }

  async function runManual(btn) {
    if (!company.value.trim()) return UI.toast(t('deep.enterCompany'), 'error');
    out.innerHTML = `<div class="loading">${t('deep.generating')}</div>`;
    try {
      const r = await UI.withSpinner(btn, () => API.post('/api/deep', {
        company: company.value.trim(),
        role: role.value.trim() || undefined,
      }));
      showPrompt(r.prompt, r.message);
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, e.message));
    }
  }

  await loadArchive();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('deep.title')),
        c('p', { className: 'page-subtitle' }, t('deep.subtitle')),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'row' }, [
        c('div', { className: 'field' }, [c('label', { htmlFor: 'deep-company' }, t('deep.companyLbl')), company]),
        c('div', { className: 'field' }, [c('label', { htmlFor: 'deep-role' }, t('deep.roleLbl')), role]),
      ]),
      c('div', { className: 'flex gap-3' }, [
        liveAvailable
          ? c('button', {
              className: 'btn btn-primary',
              title: liveEngine, // engine name kept as hover tooltip; the label stays clean
              onClick: (e) => runLive(e.currentTarget),
            }, '⚡ ' + t('deep.runLive', 'Run live'))
          : null,
        c('button', { className: 'btn btn-ghost', onClick: (e) => runManual(e.currentTarget) }, liveAvailable ? t('deep.copyPrompt', 'Copy prompt') : t('deep.run')),
      ]),
      liveAvailable
        ? null
        : c('p', { style: { color: 'var(--foggy)', fontSize: '13px', marginTop: '8px' } },
          t('deep.tipManual', 'Tip: set ANTHROPIC_API_KEY (or GEMINI_API_KEY) in .env to run research live in the browser. Without it, the prompt is generated for you to paste into Claude Code.')),
    ]),

    c('div', { className: 'mt-5' }, archive),
    c('div', { className: 'mt-5' }, out),
  ]);
});
