/* global window */
window.Router = (function () {
  const routes = {};

  // Route aliases — kept for URL stability when an internal name changes
  // and bookmarks/external links exist for the old form. The user-facing
  // hash stays e.g. `#/profile`, but internally we resolve to `settings`.
  const ALIASES = {
    profile: 'settings',
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
    const renderer = routes[name] || routes['dashboard'];

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

  return { register, render, go, current };
})();
