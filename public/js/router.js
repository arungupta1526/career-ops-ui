/* global window */
window.Router = (function () {
  const routes = {};

  // Route aliases — kept for URL stability when an internal name changes
  // and bookmarks/external links exist for the old form. v1.10.0 renamed
  // the canonical route from `settings` → `profile`; the old hash still
  // resolves so existing bookmarks keep working.
  const ALIASES = {
    settings: 'profile',
  };

  function register(name, renderer) {
    routes[name] = renderer;
  }

  function current() {
    const hash = window.location.hash.slice(2) || 'dashboard';
    const [rawName, ...rest] = hash.split('/');
    const name = ALIASES[rawName] || rawName;
    return { name, rawName, params: rest };
  }

  async function render() {
    const { name, rawName, params } = current();

    document.querySelectorAll('.nav-item').forEach((a) => {
      // Highlight nav match against EITHER the alias (rawName) or the
      // resolved route — so #/profile lights up the Profile nav item
      // even though it routes to `settings` internally.
      const r = a.dataset.route;
      a.classList.toggle('active', r === name || r === rawName);
    });

    const content = document.getElementById('content');
    // Unknown route → render the dedicated 404 view instead of silently
    // falling back to the dashboard (which masked typos and broken links).
    const renderer = routes[name] || routes['__not_found__'];

    content.innerHTML = `<div class="loading">${(window.I18n && I18n.t('router.loading', 'Loading…')) || 'Loading…'}</div>`;
    try {
      const result = await renderer(params);
      if (result instanceof Node) {
        content.innerHTML = '';
        content.appendChild(result);
      } else if (typeof result === 'string') {
        content.innerHTML = result;
      }
    } catch (err) {
      console.error(err);
      const isNet = err && err.network;
      const t = (k, f) => (window.I18n && I18n.t) ? I18n.t(k, f) : f;
      const titleStr = isNet ? t('router.netError', 'No connection to server') : t('router.error', 'Error');
      const retryStr = t('common.retry', 'Retry');
      const runStr = t('router.runStart', 'Run');
      content.innerHTML = `<div class="empty">
        <strong>${titleStr}</strong>
        <p style="margin: 12px 0 0; color: var(--foggy)">${(err && err.message) || err}</p>
        ${isNet ? `<p style="margin-top:8px;color:var(--foggy);font-size:13px;">${runStr}: <code>bash web-ui/bin/start.sh</code></p>` : ''}
        <button class="btn btn-ghost mt-3" data-action="router-retry">${retryStr}</button>
      </div>`;
      content.querySelector('[data-action="router-retry"]')?.addEventListener('click', () => render());
      if (!isNet) window.UI?.toast(err.message || 'Render error', 'error');
    }
  }

  function go(path) {
    window.location.hash = path.startsWith('#') ? path : '#' + (path.startsWith('/') ? path : '/' + path);
  }

  window.addEventListener('hashchange', render);

  // 404 view — registered here so it cannot collide with a real route name
  // and so the router never depends on an external file being loaded first.
  register('__not_found__', () => {
    const t = (k, f) => (window.I18n && window.I18n.t) ? window.I18n.t(k, f) : f;
    const { rawName } = current();
    const wrap = document.createElement('div');
    wrap.className = 'page-404 empty';
    wrap.style.padding = '64px 24px';
    wrap.style.textAlign = 'center';

    const h1 = document.createElement('h1');
    h1.className = 'page-title';
    h1.textContent = t('notFound.title', '404 — page not found');

    const p = document.createElement('p');
    p.style.color = 'var(--foggy)';
    p.style.margin = '12px 0 24px';
    const body = t('notFound.body', "The route “{path}” doesn't exist.")
      .replace('{path}', '#/' + (rawName || ''));
    p.textContent = body;

    const a = document.createElement('a');
    a.className = 'btn btn-primary';
    a.href = '#/dashboard';
    a.textContent = t('notFound.back', 'Back to Dashboard');

    wrap.append(h1, p, a);
    return wrap;
  });

  return { register, render, go, current };
})();
