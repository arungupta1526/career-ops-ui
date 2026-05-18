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

  // v1.50.0 (WS2 #28) — the doc markdown starts with its own `# Title`
  // → a SECOND <h1> on a page whose header already provides the single
  // h1. Strip every article <h1> so there's exactly one h1 and the
  // hierarchy starts cleanly at the <h2> sections (no h1→h3 skip).
  scratch.querySelectorAll('h1').forEach((h) => h.remove());

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
    // The renderer leaves heading content as raw markdown (backticks,
    // emphasis markers etc.) because the heading regex captures $1
    // verbatim. Pretty-print for the TOC by stripping inline-code
    // backticks AND rendering bold/italic markers as <strong>/<em>.
    const plain = (h.textContent || '')
      .replace(/`([^`]+)`/g, '$1')   // drop the backtick fences
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
    const a = c('a', {
      href: '#help-h-' + h.id.replace(/^help-h-/, ''),
      style: {
        display: 'block', padding: '4px 0', color: 'var(--hof)',
        textDecoration: 'none', fontSize: '13px', lineHeight: 1.55,
      },
      onClick: (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // WS2 #27 — move keyboard/SR focus to the section, not just the
        // viewport. Headings aren't focusable by default → tabindex=-1.
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    }, plain);
    a.dataset.tocText = plain.toLowerCase();
    return a;
  });

  // WS2 #12 — in-page filter over the TOC (92-heading doc).
  const tocSearch = c('input', {
    className: 'input', type: 'search',
    'aria-label': t('help.tocFilter', 'Filter sections'),
    placeholder: t('help.tocFilter', 'Filter sections'),
    style: { width: '100%', marginBottom: '10px', fontSize: '13px' },
    onInput: (e) => {
      const q = e.currentTarget.value.toLowerCase().trim();
      for (const a of tocLinks) {
        a.style.display = (!q || a.dataset.tocText.includes(q)) ? 'block' : 'none';
      }
    },
  });

  const toc = c('nav', {
    className: 'card help-toc',
    // WS2 #27 — the TOC landmark was unnamed (two unlabeled <nav>s).
    'aria-label': t('help.toc', 'On this page'),
    style: {
      // top:110px keeps the TOC below the fixed topbar (which is
      // ~88px tall + a comfortable gap) so it never sits behind it.
      position: 'sticky', top: '110px',
      padding: '16px 18px', maxHeight: 'calc(100vh - 130px)',
      overflowY: 'auto',
    },
  }, [
    c('strong', { style: { display: 'block', marginBottom: '8px', fontSize: '13px' } },
      t('help.toc', 'On this page')),
    tocSearch,
    ...tocLinks,
  ]);

  // WS2 #12 — floating back-to-top; appears after scrolling down, sends
  // focus back to the page heading (keyboard-safe, CSP-safe handler).
  const backTop = c('button', {
    className: 'btn btn-primary help-back-top',
    'aria-label': t('help.backToTop', 'Back to top'),
    style: {
      position: 'fixed', right: '24px', bottom: '24px', zIndex: 50,
      display: 'none', borderRadius: '999px', padding: '10px 14px',
    },
    onClick: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const h1 = document.querySelector('#content .page-title');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    },
  }, '↑ ' + t('help.backToTop', 'Back to top'));
  const onScroll = () => { backTop.style.display = window.scrollY > 600 ? 'block' : 'none'; };
  window.addEventListener('scroll', onScroll, { passive: true });
  // Detach the listener when the SPA leaves #/help (hashchange).
  const cleanup = () => {
    if (!location.hash.startsWith('#/help')) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', cleanup);
    }
  };
  window.addEventListener('hashchange', cleanup);

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
    backTop,
  ]);
});
