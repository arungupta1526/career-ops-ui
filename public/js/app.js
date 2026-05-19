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

  // v1.55.3 (UX-2) — surface the 4-provider OR contract. Cold-start
  // (0 keys) → red banner explaining ⚡ Run-live is in manual-prompt
  // mode + a deep link to the API-keys tab. ≥1 key → a subtle chip
  // naming the provider the OR-router will use. CSP-safe: DOM nodes +
  // addEventListener only, never innerHTML with response data.
  const PROVIDER_NAME = {
    anthropic: 'Anthropic', gemini: 'Gemini', openai: 'OpenAI', qwen: 'Qwen',
  };
  async function renderOnboardingBanner() {
    const host = document.getElementById('onboarding-banner');
    if (!host) return;
    let st;
    try {
      st = await API.get('/api/status/providers');
    } catch {
      host.hidden = true; // status unknown → say nothing (fail-soft)
      return;
    }
    host.textContent = '';
    host.classList.remove('onboarding-warn', 'onboarding-ok');
    if (!st || !Array.isArray(st.keysConfigured) || st.keysConfigured.length === 0) {
      host.classList.add('onboarding-warn');
      const msg = document.createElement('span');
      msg.textContent = I18n.t(
        'onboarding.noKey.title',
        'No LLM key set — “⚡ Run live” is in manual-prompt mode.');
      const cta = document.createElement('a');
      cta.href = '#/config?tab=api-keys';
      cta.className = 'btn btn-sm btn-dark';
      cta.textContent = I18n.t('onboarding.noKey.cta', 'Set up a key →');
      host.append(msg, ' ', cta);
      host.hidden = false;
    } else {
      host.classList.add('onboarding-ok');
      const name = PROVIDER_NAME[st.activeProvider] || st.activeProvider || '';
      const label = I18n.t('onboarding.activeProvider', 'Live eval');
      const chip = document.createElement('span');
      chip.textContent = label + ': ' + name +
        (st.activeModel ? ' (' + st.activeModel + ')' : '');
      host.append(chip);
      host.hidden = false;
    }
  }
  renderOnboardingBanner();
  // Re-evaluate when the user returns from the config tab (keys may
  // have just been saved) and on locale change so copy stays localized.
  window.addEventListener('hashchange', () => {
    if (!String(window.location.hash || '').includes('/config')) renderOnboardingBanner();
  });
  I18n.onChange(renderOnboardingBanner);

  // initial route
  if (!window.location.hash) window.location.hash = '#/dashboard';
  // i18n first paint
  renderLangSwitcher();
  applyI18n();
  Router.render();

  // top-bar buttons
  document.getElementById('btn-doctor').addEventListener('click', async (e) => {
    UI.toast(I18n.t('app.runDoctor', 'Running doctor.mjs…'));
    try {
      const r = await UI.withSpinner(e.currentTarget, () => API.post('/api/run/doctor'));
      // BUG-008-tb (v1.58.6) — modal title must equal the visible button
      // label. Pre-v1.58.6 the top-bar passed the hardcoded English
      // 'doctor' regardless of locale; the Health-page entry already
      // uses t('health.runDoctor'). Both entries now follow the
      // ledger BUG-008 invariant: modal-title == localized button label.
      UI.modal(I18n.t('top.doctor', 'Doctor'), UI.el('pre', { className: 'console' }, (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '')));
    } catch (err) {
      // err may be undefined / null when a Promise rejects without an Error
      // payload (rare but possible during teardown). Guard the property read.
      UI.toast((err && err.message) || 'doctor failed', 'error');
    }
  });
  document.getElementById('btn-quick-scan').addEventListener('click', () => Router.go('/scan'));
  // connection-banner refresh button (was inline onclick — moved out for CSP)
  document.getElementById('conn-refresh-btn')?.addEventListener('click', () => location.reload());

  // v1.12.0 — Theme toggle. Click cycles light → dark → light and persists.
  // The icon swaps to ☀ in dark mode so the affordance reads correctly.
  function readEffectiveTheme() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch {}
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '🌙';
  }
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = readEffectiveTheme() === 'dark' ? '☀' : '🌙';
    themeBtn.addEventListener('click', () => {
      applyTheme(readEffectiveTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // global search
  const search = document.getElementById('global-search');
  // v1.56.4 — UX-N2: surface the Cmd/Ctrl+K shortcut visibly so
  // sighted users discover it. The keybinding itself is wired further
  // down; the badge is aria-hidden (aria-label already covers AT).
  const kbdHint = document.querySelector('.kbd-shortcut');
  if (kbdHint) {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
    kbdHint.textContent = isMac ? kbdHint.dataset.mac : kbdHint.dataset.other;
  }
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = search.value.trim();
      if (!q) return;
      // v1.16.0 — URL paste UX:
      //   • Enter         → ✨ auto-pipeline (full flow per career-ops.org/docs)
      //   • Shift+Enter   → quick add-to-pipeline only (legacy behavior)
      // Pasting non-URLs jumps to the tracker (search) — unchanged.
      if (q.startsWith('http')) {
        if (e.shiftKey) {
          API.post('/api/pipeline', { url: q }).then(() => {
            UI.toast(I18n.t('pipe.added', 'Added to pipeline'), 'success');
            search.value = '';
            if (Router.current().name === 'pipeline') Router.render();
          }).catch((err) => UI.toast((err && err.message) || 'add failed', 'error'));
        } else if (window.AutoPipeline) {
          search.value = '';
          window.AutoPipeline.open({ prefillUrl: q, autoStart: true });
        } else {
          // Fallback when auto-pipeline.js failed to load.
          API.post('/api/pipeline', { url: q }).then(() => {
            UI.toast(I18n.t('pipe.added', 'Added to pipeline'), 'success');
            search.value = '';
            if (Router.current().name === 'pipeline') Router.render();
          }).catch((err) => UI.toast((err && err.message) || 'add failed', 'error'));
        }
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

  // FIX-M4 — clear the global search input on every route change so
  // typed queries don't bleed into the next page. We skip the clear
  // when the user is actively typing (focus is in the input) — that
  // keeps Ctrl+K → type → Enter → navigate flows uninterrupted.
  window.addEventListener('hashchange', () => {
    if (document.activeElement !== search) search.value = '';
  });

  // modal close handlers
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined) UI.closeModal();
  });

  // ── mobile sidebar drawer ──
  // Hamburger button toggles `body.sidebar-open`; CSS rules in
  // app.css (media query <900 px) translate the sidebar in/out.
  // Backdrop and any nav-item click also close it so the user lands
  // on the new page with the sidebar tucked away.
  const toggle = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  // v1.17.0 — keep aria-expanded in sync so screen readers know the
  // mobile drawer state.
  function syncSidebarAria() {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', document.body.classList.contains('sidebar-open') ? 'true' : 'false');
  }
  function closeSidebar() { document.body.classList.remove('sidebar-open'); syncSidebarAria(); }
  function openSidebar()  { document.body.classList.add('sidebar-open'); syncSidebarAria(); }
  if (toggle) toggle.addEventListener('click', () => {
    if (document.body.classList.contains('sidebar-open')) closeSidebar();
    else openSidebar();
  });
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  document.querySelectorAll('.sidebar a').forEach((a) =>
    a.addEventListener('click', closeSidebar));
  window.addEventListener('hashchange', closeSidebar);
})();
