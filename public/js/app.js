/* global Router, API, UI */
(async function init() {
  // load version + health (silent on warnings; only toast on real failures)
  try {
    const h = await API.get('/api/health');
    document.getElementById('footer-version').textContent = 'v' + h.version;
    // h.ok=false ONLY when a REQUIRED check fails. Optional misses (no GEMINI_API_KEY) just lower h.ok? — no, server now keeps ok=true for optional misses.
    if (!h.ok) {
      const failed = h.checks.filter((c) => c.required && !c.ok).map((c) => c.name);
      UI.toast('Setup проблема: ' + failed.join(', '), 'error');
    }
    // Don't toast warnings — visible badge in Health page is enough.
  } catch (err) {
    document.getElementById('footer-version').textContent = 'offline';
    // Network banner is shown by api.js — no extra toast needed
  }

  // initial route
  if (!window.location.hash) window.location.hash = '#/dashboard';
  Router.render();

  // top-bar buttons
  document.getElementById('btn-doctor').addEventListener('click', async () => {
    UI.toast('Запускаю doctor.mjs…');
    try {
      const r = await API.post('/api/run/doctor');
      UI.modal('doctor', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  });
  document.getElementById('btn-quick-scan').addEventListener('click', () => Router.go('/scan'));

  // global search
  const search = document.getElementById('global-search');
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = search.value.trim();
      if (!q) return;
      // simple URL paste detection → add to pipeline
      if (q.startsWith('http')) {
        API.post('/api/pipeline', { url: q }).then(() => {
          UI.toast('Добавлено в pipeline', 'success');
          search.value = '';
          if (Router.current().name === 'pipeline') Router.render();
        }).catch((err) => UI.toast(err.message, 'error'));
      } else {
        Router.go('/tracker');
      }
    }
  });

  // ctrl+k
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      search.focus();
    }
    if (e.key === 'Escape') {
      const m = document.getElementById('modal');
      if (!m.hidden) UI.closeModal();
    }
  });

  // modal close handlers
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined) UI.closeModal();
  });
})();
