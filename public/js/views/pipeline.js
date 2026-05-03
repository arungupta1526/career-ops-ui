/* global Router, API, UI, I18n */
Router.register('pipeline', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  // ── state ──
  let allUrls = [];
  let filterQuery = '';
  let activeUrl = null;       // currently selected for preview
  let previewBody = '';
  let previewLoading = false;

  // ── elements ──
  const filterInput = c('input', {
    className: 'input',
    placeholder: t('pipe.filter', 'Filter URLs…'),
    style: { maxWidth: '320px' },
  });
  const list = c('div', { id: 'pipeline-list', className: 'card', style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
  const previewPane = c('div', { className: 'card', style: { minHeight: '120px' } });
  const newUrl = c('input', { className: 'input', placeholder: t('pipe.placeholder') });
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
            if (!confirm(t('pipe.confirmDel'))) return;
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
    previewLoading = true;
    renderPreview();
    try {
      const r = await API.get('/api/pipeline/preview?url=' + encodeURIComponent(url));
      previewBody = (r.text || '').slice(0, 4000);
    } catch (e) {
      previewBody = '(' + (e.message || 'fetch failed') + ')';
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
            if (!confirm(t('pipe.confirmDel'))) return;
            await UI.withSpinner(e.currentTarget,
              () => API.del('/api/pipeline?url=' + encodeURIComponent(url)));
            UI.toast(t('pipe.deleted'));
            if (activeUrl === url) { activeUrl = null; previewBody = ''; }
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
            if (!confirm(t('pipe.evaluateAllConfirm', 'Open the first queued URL on Evaluate?'))) return;
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
      c('p', { className: 'field-hint mt-3', style: { margin: '12px 0 0' } }, t('pipe.hint')),
    ]),

    c('div', { className: 'flex gap-3 mb-3', style: { alignItems: 'center', flexWrap: 'wrap' } },
      [counter, filterInput]),

    c('div', { className: 'grid-2', style: { gap: '16px' } }, [list, previewPane]),
  ]);
});
