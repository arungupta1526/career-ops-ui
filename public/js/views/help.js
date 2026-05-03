/* global Router, API, UI, I18n */
/**
 * /#/help — long-form user guide. Loads docs/help/{lang}.md from the
 * server and renders it via the XSS-safe UI.md(). Falls back to English
 * when a locale file is missing. The page also has a sticky table of
 * contents on the left (auto-built from heading levels).
 */
Router.register('help', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const lang = (I18n.getLang && I18n.getLang()) || 'en';

  let payload;
  try {
    payload = await API.get('/api/help/' + encodeURIComponent(lang));
  } catch (e) {
    return c('div', null, [
      c('h1', { className: 'page-title' }, t('help.title', 'Help')),
      c('div', { className: 'empty' }, e.message || 'failed to load'),
    ]);
  }

  const article = c('div', {
    className: 'card md help-article',
    style: { padding: '24px 32px', maxWidth: '880px' },
    html: UI.md(payload.markdown || ''),
  });

  // Build a Table of Contents from the rendered <h2> nodes.
  const tocItems = [];
  setTimeout(() => {
    const headings = article.querySelectorAll('h2');
    if (!headings.length) return;
    const toc = c('nav', {
      className: 'card help-toc',
      style: {
        position: 'sticky', top: '20px',
        padding: '16px 18px', maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto', fontSize: '13px', lineHeight: 1.55,
      },
    }, [
      c('strong', { style: { display: 'block', marginBottom: '8px' } }, t('help.toc', 'On this page')),
      ...Array.from(headings).map((h, i) => {
        const id = 'help-h-' + i;
        h.id = id;
        return c('a', {
          href: '#/help',
          onClick: (e) => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
          style: {
            display: 'block', padding: '4px 0', color: 'var(--hof)',
            textDecoration: 'none', borderBottom: '1px solid transparent',
          },
        }, h.textContent || '');
      }),
    ]);
    tocItems.push(toc);
    const tocHost = document.getElementById('help-toc-host');
    if (tocHost) {
      tocHost.innerHTML = '';
      tocHost.appendChild(toc);
    }
  }, 50);

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('help.title', 'Help')),
        c('p', { className: 'page-subtitle' }, t('help.subtitle', 'Step-by-step walkthrough of every page.')),
      ]),
    ]),
    c('div', {
      className: 'help-grid',
      style: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' },
    }, [
      c('div', { id: 'help-toc-host', style: { minWidth: '240px' } }, []),
      article,
    ]),
  ]);
});
