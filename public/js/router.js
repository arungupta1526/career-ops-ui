/* global window */
window.Router = (function () {
  const routes = {};

  function register(name, renderer) {
    routes[name] = renderer;
  }

  function current() {
    const hash = window.location.hash.slice(2) || 'dashboard';
    const [name, ...rest] = hash.split('/');
    return { name, params: rest };
  }

  async function render() {
    const { name, params } = current();

    document.querySelectorAll('.nav-item').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === name);
    });

    const content = document.getElementById('content');
    const renderer = routes[name] || routes['dashboard'];

    content.innerHTML = '<div class="loading">Загрузка…</div>';
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
      content.innerHTML = `<div class="empty">
        <strong>${isNet ? 'Нет связи с сервером' : 'Ошибка'}</strong>
        <p style="margin: 12px 0 0; color: var(--foggy)">${(err && err.message) || err}</p>
        ${isNet ? '<p style="margin-top:8px;color:var(--foggy);font-size:13px;">Запустите: <code>bash web-ui/bin/start.sh</code></p>' : ''}
        <button class="btn btn-ghost mt-3" onclick="Router.render()">Повторить</button>
      </div>`;
      // Only toast non-network errors (banner already shown for network)
      if (!isNet) window.UI?.toast(err.message || 'Render error', 'error');
    }
  }

  function go(path) {
    window.location.hash = path.startsWith('#') ? path : '#' + (path.startsWith('/') ? path : '/' + path);
  }

  window.addEventListener('hashchange', render);

  return { register, render, go, current };
})();
