/* global Router, API, UI, I18n */
Router.register('deep', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  const company = c('input', { className: 'input', placeholder: t('deep.companyExample') });
  const role = c('input', { className: 'input', placeholder: t('deep.roleExample') });
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
      const btn = c('button', {
        className: 'btn btn-ghost btn-sm',
        title: new Date(f.mtime).toLocaleString(),
        onClick: async (e) => {
          const r = await UI.withSpinner(e.currentTarget, () => API.get('/api/interview-prep/' + encodeURIComponent(f.name)));
          showResult(f.name, r.markdown, { saved: f.name });
        },
      }, [c('span', null, f.name.replace(/\.md$/, '')), c('span', { style: { marginLeft: '8px', color: 'var(--foggy)' } }, formatRelative(f.mtime))]);
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

  function formatRelative(iso) {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return '1d ago';
    if (days < 30) return days + 'd ago';
    return d.toLocaleDateString();
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
      ]),
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
        c('div', { className: 'field' }, [c('label', null, t('deep.companyLbl')), company]),
        c('div', { className: 'field' }, [c('label', null, t('deep.roleLbl')), role]),
      ]),
      c('div', { className: 'flex gap-3' }, [
        liveAvailable
          ? c('button', { className: 'btn btn-primary', onClick: (e) => runLive(e.currentTarget) }, '⚡ ' + t('deep.runLive', 'Run live') + ' (' + liveEngine + ')')
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
