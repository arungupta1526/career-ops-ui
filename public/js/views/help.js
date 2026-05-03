/* global Router, API, UI, I18n */
/**
 * /#/help — long-form user guide. Loads docs/help/{lang}.md from the
 * server and renders it via the XSS-safe UI.md(). Falls back to English
 * when a locale file is missing. Builds a sticky table of contents
 * from <h2> headings synchronously (no setTimeout race).
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
      c('header', { className: 'page-header' }, c('h1', { className: 'page-title' }, t('help.title', 'Help'))),
      c('div', { className: 'empty' }, e.message || 'failed to load help'),
    ]);
  }

  // Render markdown into a hidden scratch div so we can extract h2's
  // and assign anchor IDs BEFORE the DOM lands on the page.
  const scratch = document.createElement('div');
  scratch.innerHTML = UI.md(payload.markdown || '');

  // Assign stable IDs to h2's so the TOC can scroll to them.
  const headings = Array.from(scratch.querySelectorAll('h2'));
  headings.forEach((h, i) => { h.id = 'help-h-' + i; });

  // Build the article and TOC in one synchronous pass.
  const article = c('div', {
    className: 'card md help-article',
    style: { padding: '24px 32px', maxWidth: '880px' },
  });
  // Move every child from scratch into article (preserves IDs).
  while (scratch.firstChild) article.appendChild(scratch.firstChild);

  const tocLinks = headings.map((h) => {
    const a = c('a', {
      href: '#help-h-' + h.id.replace(/^help-h-/, ''),
      style: {
        display: 'block', padding: '4px 0', color: 'var(--hof)',
        textDecoration: 'none', fontSize: '13px', lineHeight: 1.55,
      },
      onClick: (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    }, h.textContent || '');
    return a;
  });

  const toc = c('nav', {
    className: 'card help-toc',
    style: {
      position: 'sticky', top: '20px',
      padding: '16px 18px', maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto',
    },
  }, [
    c('strong', { style: { display: 'block', marginBottom: '8px', fontSize: '13px' } },
      t('help.toc', 'On this page')),
    ...tocLinks,
  ]);

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
      headings.length ? toc : c('div'),
      article,
    ]),
  ]);
});
