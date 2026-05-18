/* global Router, API, UI, I18n */
Router.register('pipeline', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  // ── state ──
  let allUrls = [];
  let filterQuery = '';
  let activeUrl = null;       // currently selected for preview
  let previewBody = '';
  let previewError = '';   // WS2 #22 — distinct from previewBody
  let previewLoading = false;

  // ── elements ──
  // v1.20.0 — WCAG 1.3.1: every interactive input owns an id +
  // accessible name. `aria-label` covers placeholder-only inputs
  // (no visible label sibling).
  const filterInput = c('input', {
    id: 'pipe-filter',
    'aria-label': t('pipe.filter', 'Filter URLs…'),
    className: 'input',
    placeholder: t('pipe.filter', 'Filter URLs…'),
    style: { maxWidth: '320px' },
  });
  const list = c('div', { id: 'pipeline-list', className: 'card', style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
  // v1.48.0 (WS2 #22) — the preview is a polite live region with an
  // accessible name; a fetch failure renders a distinct role=alert
  // block, not disguised as preview body text.
  const previewPane = c('div', {
    id: 'pipe-preview', className: 'card', style: { minHeight: '120px' },
    role: 'region', 'aria-live': 'polite',
    'aria-label': t('pipe.previewRegion', 'Job preview'),
  });
  const newUrl = c('input', {
    id: 'pipe-new-url',
    'aria-label': t('pipe.placeholder'),
    'aria-describedby': 'pipe-new-url-hint',
    className: 'input',
    placeholder: t('pipe.placeholder'),
  });
  const counter = c('strong');

  function shortHost(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.slice(0, 40); }
  }

  function renderPreview() {
    previewPane.innerHTML = '';
    if (!activeUrl) {
      previewPane.appendChild(c('div', { className: 'empty', style: { border: 'none' } },
        t('pipe.previewIdle', 'Pick a URL to preview, evaluate, or delete.')));
      return;
    }
    const head = c('div', { className: 'flex-between mb-3', style: { flexWrap: 'wrap', gap: '8px' } }, [
      c('div', { style: { minWidth: 0, flex: 1 } }, [
        c('strong', null, shortHost(activeUrl)),
        c('a', {
          href: activeUrl, target: '_blank', rel: 'noopener',
          style: { display: 'block', fontSize: '13px', color: 'var(--foggy)', wordBreak: 'break-all', marginTop: '4px' },
        }, activeUrl),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', {
          className: 'btn btn-primary btn-sm',
          onClick: () => Router.go('/evaluate?url=' + encodeURIComponent(activeUrl)),
        }, '▶ ' + t('pipe.evaluateBtn')),
        c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => window.open(activeUrl, '_blank', 'noopener'),
        }, '↗ ' + t('pipe.openTab', 'Open')),
        c('button', {
          className: 'btn btn-ghost btn-sm',
          style: { color: 'var(--rausch)' },
          onClick: async (e) => {
            if (!(await UI.confirm(
              t('pipe.confirmDelTitle', 'Remove from pipeline?'),
              t('pipe.confirmDel'),
              { danger: true, confirmLabel: t('common.delete', 'Delete'), cancelLabel: t('common.cancel', 'Cancel') }))) return;
            await UI.withSpinner(e.currentTarget,
              () => API.del('/api/pipeline?url=' + encodeURIComponent(activeUrl)));
            UI.toast(t('pipe.deleted'));
            activeUrl = null;
            await refresh();
          },
        }, '✕ ' + t('common.delete', 'Delete')),
      ]),
    ]);
    previewPane.appendChild(head);

    if (previewLoading) {
      previewPane.appendChild(c('div', { className: 'loading' }, t('pipe.previewLoading', 'Loading preview…')));
      return;
    }
    if (previewError) {
      previewPane.appendChild(c('div', {
        className: 'empty', role: 'alert',
        style: { border: 'none', padding: '20px', color: 'var(--rausch)' },
      }, '✗ ' + t('pipe.previewError', 'Preview failed') + ': ' + previewError));
      return;
    }
    if (!previewBody) {
      previewPane.appendChild(c('div', { className: 'empty', style: { border: 'none', padding: '20px' } },
        t('pipe.previewUnavailable', 'No preview yet — open in tab to see the page.')));
      return;
    }
    previewPane.appendChild(c('pre', {
      className: 'console',
      style: { maxHeight: '320px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '13px' },
    }, previewBody));
  }

  async function selectUrl(url) {
    activeUrl = url;
    previewBody = '';
    previewError = '';
    previewLoading = true;
    renderPreview();
    try {
      const r = await API.get('/api/pipeline/preview?url=' + encodeURIComponent(url));
      previewBody = (r.text || '').slice(0, 4000);
    } catch (e) {
      previewError = e.message || 'fetch failed';
    } finally {
      previewLoading = false;
      renderPreview();
    }
  }

  function urlRow(url) {
    const isActive = url === activeUrl;
    return c('div', {
      className: 'flex-between pipeline-row',
      'data-url': url,
      style: {
        padding: '10px 14px',
        border: '1px solid ' + (isActive ? 'var(--hof)' : 'var(--slate)'),
        borderRadius: 'var(--radius)',
        background: isActive ? 'var(--beach)' : 'transparent',
        cursor: 'pointer',
      },
    }, [
      c('div', {
        style: { flex: 1, minWidth: 0 },
        onClick: () => selectUrl(url),
      }, [
        c('div', { style: { fontWeight: 600, fontSize: '14px' } }, shortHost(url)),
        // Keep an <a> with href so existing tests + accessibility tools
        // can locate the row by URL. stopPropagation prevents the row's
        // selectUrl handler from firing when the link is clicked
        // directly — middle-click / Cmd-click open in a new tab as
        // expected.
        c('a', {
          href: url,
          target: '_blank',
          rel: 'noopener',
          onClick: (e) => e.stopPropagation(),
          style: { display: 'block', fontSize: '12px', color: 'var(--foggy)', wordBreak: 'break-all', marginTop: '2px', textDecoration: 'none' },
        }, url),
      ]),
      c('div', { className: 'flex gap-1' }, [
        c('button', {
          className: 'btn btn-ghost btn-sm',
          title: t('pipe.evaluateBtn'),
          onClick: (e) => { e.stopPropagation(); Router.go('/evaluate?url=' + encodeURIComponent(url)); },
        }, '▶'),
        c('button', {
          className: 'btn btn-ghost btn-sm pipeline-row-delete',
          title: t('common.delete', 'Delete'),
          onClick: async (e) => {
            e.stopPropagation();
            if (!(await UI.confirm(
              t('pipe.confirmDelTitle', 'Remove from pipeline?'),
              t('pipe.confirmDel'),
              { danger: true, confirmLabel: t('common.delete', 'Delete'), cancelLabel: t('common.cancel', 'Cancel') }))) return;
            await UI.withSpinner(e.currentTarget,
              () => API.del('/api/pipeline?url=' + encodeURIComponent(url)));
            UI.toast(t('pipe.deleted'));
            if (activeUrl === url) { activeUrl = null; previewBody = ''; previewError = ''; }
            await refresh();
          },
        }, '✕'),
      ]),
    ]);
  }

  function renderList() {
    list.innerHTML = '';
    const q = filterQuery.trim().toLowerCase();
    const filtered = q ? allUrls.filter((u) => u.toLowerCase().includes(q)) : allUrls;
    counter.textContent = `${t('pipe.count', 'In queue')}: ${filtered.length}` +
      (q && filtered.length !== allUrls.length ? ` / ${allUrls.length}` : '');
    if (filtered.length === 0) {
      list.appendChild(c('div', {
        className: 'empty',
        style: { border: 'none', padding: '20px' },
      }, q ? t('pipe.noResults', 'No matches') : t('pipe.empty')));
      return;
    }
    filtered.forEach((u) => list.appendChild(urlRow(u)));
  }

  async function refresh() {
    const fresh = await API.get('/api/pipeline');
    allUrls = fresh.urls || [];
    renderList();
    renderPreview();
  }

  filterInput.addEventListener('input', (e) => {
    filterQuery = e.target.value;
    renderList();
  });

  // ── initial paint ──
  allUrls = (await API.get('/api/pipeline')).urls || [];
  renderList();
  renderPreview();

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('pipe.title')),
        c('p', { className: 'page-subtitle' }, t('pipe.subtitle')),
      ]),
      c('div', { className: 'flex gap-3' }, [
        c('button', {
          className: 'btn btn-ghost',
          onClick: async () => {
            if (allUrls.length === 0) return UI.toast(t('pipe.empty'), 'error');
            if (!(await UI.confirm(
              t('pipe.evaluateAllTitle', 'Evaluate first queued URL?'),
              t('pipe.evaluateAllConfirm', 'Open the first queued URL on Evaluate?'),
              { danger: false, confirmLabel: t('common.confirm', 'Confirm'), cancelLabel: t('common.cancel', 'Cancel') }))) return;
            Router.go('/evaluate?url=' + encodeURIComponent(allUrls[0]));
          },
        }, '⚡ ' + t('pipe.evaluateAll', 'Evaluate first')),
        c('button', {
          className: 'btn btn-ghost',
          onClick: () => Router.go('/scan'),
        }, t('scan.title')),
      ]),
    ]),

    c('div', { className: 'card mb-3' }, [
      c('h3', { style: { marginTop: 0 } }, t('pipe.add')),
      c('div', { className: 'flex gap-3' }, [
        newUrl,
        c('button', {
          className: 'btn btn-primary',
          onClick: async (e) => {
            const u = newUrl.value.trim();
            if (!u) return UI.toast(t('pipe.enterUrl'), 'error');
            try {
              await UI.withSpinner(e.currentTarget, () => API.post('/api/pipeline', { url: u }));
              newUrl.value = '';
              UI.toast(t('pipe.added'), 'success');
              await refresh();
            } catch (err) {
              UI.toast(err.message || 'error', 'error');
            }
          },
        }, '+ ' + t('common.add')),
      ]),
      c('p', { id: 'pipe-new-url-hint', className: 'field-hint mt-3', style: { margin: '12px 0 0' } }, t('pipe.hint')),
    ]),

    c('div', { className: 'flex gap-3 mb-3', style: { alignItems: 'center', flexWrap: 'wrap' } },
      [counter, filterInput]),

    c('div', { className: 'grid-2', style: { gap: '16px' } }, [list, previewPane]),
  ]);
});
