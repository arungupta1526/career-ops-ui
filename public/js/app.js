/* global Router, API, UI, I18n */

// ── i18n bootstrap: render lang switcher + apply translations on every change ──
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const fallback = el.textContent;
    el.textContent = I18n.t(key, fallback);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = I18n.t(key, el.placeholder);
  });
}

function renderLangSwitcher() {
  const host = document.getElementById('lang-switcher');
  if (!host) return;
  host.innerHTML = '';
  const current = I18n.getLang();
  for (const l of I18n.getLangs()) {
    const btn = document.createElement('button');
    btn.className = 'lang-btn' + (l.code === current ? ' active' : '');
    btn.textContent = l.label;
    btn.title = l.code;
    btn.dataset.langBtn = l.code;
    btn.addEventListener('click', () => I18n.setLang(l.code));
    host.appendChild(btn);
  }
}

I18n.onChange(() => {
  applyI18n();
  renderLangSwitcher();
  // re-render the current view so per-view translations apply
  if (window.Router) Router.render();
});

(async function init() {
  // load version + health (silent on warnings; only toast on real failures)
  try {
    const h = await API.get('/api/health');
    document.getElementById('footer-version').textContent = 'v' + h.version;
    // h.ok=false ONLY when a REQUIRED check fails. Optional misses (no GEMINI_API_KEY) just lower h.ok? — no, server now keeps ok=true for optional misses.
    if (!h.ok) {
      const failed = h.checks.filter((c) => c.required && !c.ok).map((c) => c.name);
      UI.toast(I18n.t('app.setupIssue', 'Setup issue: ') + failed.join(', '), 'error');
    }
    // Don't toast warnings — visible badge in Health page is enough.
  } catch (err) {
    document.getElementById('footer-version').textContent = 'offline';
    // Network banner is shown by api.js — no extra toast needed
  }

  // initial route
  if (!window.location.hash) window.location.hash = '#/dashboard';
  // i18n first paint
  renderLangSwitcher();
  applyI18n();
  Router.render();

  // top-bar buttons
  document.getElementById('btn-doctor').addEventListener('click', async () => {
    UI.toast(I18n.t('app.runDoctor', 'Running doctor.mjs…'));
    try {
      const r = await API.post('/api/run/doctor');
      UI.modal('doctor', UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  });
  document.getElementById('btn-quick-scan').addEventListener('click', () => Router.go('/scan'));
  // connection-banner refresh button (was inline onclick — moved out for CSP)
  document.getElementById('conn-refresh-btn')?.addEventListener('click', () => location.reload());

  // global search
  const search = document.getElementById('global-search');
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = search.value.trim();
      if (!q) return;
      // simple URL paste detection → add to pipeline
      if (q.startsWith('http')) {
        API.post('/api/pipeline', { url: q }).then(() => {
          UI.toast(I18n.t('pipe.added', 'Added to pipeline'), 'success');
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
