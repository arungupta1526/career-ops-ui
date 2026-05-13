/* global Router, API, UI, I18n */
/**
 * /#/config — application configuration. Lets the user set the API
 * keys, scanner knobs, and server settings WITHOUT shelling out to
 * edit `.env` by hand. Writes to the parent project's .env so both
 * career-ops scripts and web-ui's dotenv loader pick up the changes.
 *
 * Secret values are masked on read (first/last 4 chars). Saving an
 * empty field unsets that key in the .env.
 */
Router.register('config', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);

  let cfg;
  try {
    cfg = await API.get('/api/config');
  } catch (e) {
    return c('div', null, [
      c('header', { className: 'page-header' },
        c('h1', { className: 'page-title' }, t('config.title', 'App settings'))),
      c('div', { className: 'empty' }, e.message || 'failed to load'),
    ]);
  }

  const fields = {};
  // Curated model lists. The first entry per provider doubles as the
  // default when the user hasn't explicitly set the env var. Adding
  // a new model here is one-line — picks up automatically on the UI
  // dropdown.
  const ANTHROPIC_MODELS = [
    'claude-sonnet-4-6',
    'claude-opus-4-7',
    'claude-haiku-4-5',
    'claude-3-7-sonnet-latest',
    'claude-3-5-haiku-latest',
  ];
  const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-thinking-exp',
  ];
  const FIELDS = [
    {
      key: 'ANTHROPIC_API_KEY', secret: true,
      labelKey: 'config.anthropicKey', label: 'ANTHROPIC_API_KEY',
      hintKey: 'config.anthropicHint',
      hintFallback: 'Get one at console.anthropic.com → API keys. When set, the "⚡ Run live" button executes prompts via Claude.',
    },
    {
      key: 'ANTHROPIC_MODEL', secret: false, kind: 'select',
      options: ANTHROPIC_MODELS, defaultValue: 'claude-sonnet-4-6',
      labelKey: 'config.anthropicModel', label: 'ANTHROPIC_MODEL',
      hintKey: 'config.anthropicModelHint',
      hintFallback: 'Default: claude-sonnet-4-6. Heavier reasoning: claude-opus-4-7. Cheap & fast: claude-haiku-4-5.',
    },
    {
      key: 'GEMINI_API_KEY', secret: true,
      labelKey: 'config.geminiKey', label: 'GEMINI_API_KEY',
      hintKey: 'config.geminiHint',
      hintFallback: 'Free tier at aistudio.google.com/apikey. Used as fallback when Anthropic isn\'t set.',
    },
    {
      key: 'GEMINI_MODEL', secret: false, kind: 'select',
      options: GEMINI_MODELS, defaultValue: 'gemini-2.0-flash',
      labelKey: 'config.geminiModel', label: 'GEMINI_MODEL',
      hintKey: 'config.geminiModelHint',
      hintFallback: 'Default: gemini-2.0-flash (free-tier, fast). Pro tier: gemini-1.5-pro.',
    },
    {
      key: 'HH_USER_AGENT', secret: false,
      labelKey: 'config.hhUserAgent', label: 'HH_USER_AGENT',
      hintKey: 'config.hhUserAgentHint',
      hintFallback: 'Real-browser User-Agent for hh.ru API. Required when scanning from non-RU IPs.',
    },
    {
      key: 'PORT', secret: false,
      labelKey: 'config.port', label: 'PORT',
      hintKey: 'config.portHint',
      hintFallback: 'Default 4317. Restart the server after changing.',
    },
    {
      key: 'HOST', secret: false,
      labelKey: 'config.host', label: 'HOST',
      hintKey: 'config.hostHint',
      hintFallback: 'Default 127.0.0.1 (loopback). 0.0.0.0 exposes the UI to your LAN — only do that on a trusted network.',
    },
  ];

  const dirty = new Set();

  function fieldRow(spec) {
    const value = cfg.values[spec.key] || '';
    let input;
    if (spec.kind === 'select') {
      // Dropdown for known-enum fields (model selection).
      // Pre-select the saved value; if unset use the spec's default.
      const current = value || spec.defaultValue || '';
      input = c('select', {
        className: 'select',
        style: { minWidth: '300px', fontSize: '13px' },
        onChange: () => dirty.add(spec.key),
      }, spec.options.map((opt) => c('option', { value: opt }, opt)));
      input.value = current;
    } else {
      input = c('input', {
        className: 'input',
        type: spec.secret ? 'password' : 'text',
        placeholder: spec.secret && value
          ? value /* show masked preview as placeholder when set */
          : (spec.label || ''),
        style: { fontFamily: 'ui-monospace,monospace', fontSize: '13px' },
        onInput: () => dirty.add(spec.key),
      });
      // Only pre-populate if NOT secret (we never echo secrets back).
      if (!spec.secret) input.value = value;
    }
    fields[spec.key] = input;
    return c('div', { className: 'field', style: { marginBottom: '20px' } }, [
      c('label', { style: { fontWeight: 600, fontSize: '14px' } }, [
        spec.label,
        spec.secret && value
          ? c('span', { style: { marginLeft: '10px', fontSize: '12px', color: 'var(--ok, #008a05)', fontWeight: 'normal' } }, '✓ set')
          : null,
      ]),
      c('p', { style: { color: 'var(--foggy)', fontSize: '13px', margin: '4px 0 8px' } },
        t(spec.hintKey, spec.hintFallback)),
      input,
    ]);
  }

  async function save(btn) {
    const body = {};
    for (const spec of FIELDS) {
      // Secrets: only send if user touched the field. Non-secrets: always send.
      if (spec.secret && !dirty.has(spec.key)) continue;
      body[spec.key] = fields[spec.key].value;
    }
    try {
      const r = await UI.withSpinner(btn, () => API.post('/api/config', body));
      UI.toast(t('config.saved', 'Settings saved · ' + (r.written?.length || 0) + ' key(s)'), 'success');
      dirty.clear();
      // Re-fetch so masked previews refresh.
      cfg = await API.get('/api/config');
      // Re-render in place by re-routing.
      Router.render();
    } catch (e) {
      UI.toast(e.message || 'save failed', 'error');
    }
  }

  // ─── Profile tab — direct editor for config/profile.yml ───
  const profileTextarea = c('textarea', {
    className: 'textarea',
    rows: 22,
    style: { minHeight: '420px', fontFamily: 'ui-monospace,monospace', fontSize: '13px' },
  });
  let profileLoaded = false;

  async function loadProfileTab() {
    if (profileLoaded) return;
    try {
      const data = await API.get('/api/profile');
      profileTextarea.value = (data && data.raw) || '';
      profileLoaded = true;
    } catch (e) {
      profileTextarea.value = '# error: ' + (e.message || e);
    }
  }

  async function saveProfile(btn) {
    if (!profileTextarea.value.trim()) {
      UI.toast(t('config.profileEmpty', 'Profile YAML is empty'), 'error');
      return;
    }
    try {
      const r = await UI.withSpinner(btn, () =>
        API.put('/api/profile', { yaml: profileTextarea.value }));
      UI.toast(t('config.profileSaved', 'Profile saved') +
        (r.candidate ? ` · ${r.candidate}` : ''), 'success');
      // Re-read so the user sees the canonical "# Career-Ops…" header.
      const data = await API.get('/api/profile');
      profileTextarea.value = data.raw || profileTextarea.value;
    } catch (e) {
      UI.toast(e.message || 'save failed', 'error');
    }
  }

  // ─── Tab plumbing ───
  // F-013: group fields by cfg.groups (core | runtime | regional). The
  // regional group is auto-collapsed and only present when portals.yml
  // declares at least one regional source.
  const groups = (cfg && cfg.groups) || {};
  const regionalActive = !!(cfg && cfg.regionalActive);
  const groupOf = (k) => groups[k] || 'core';
  const groupTitle = (g) => ({
    core: t('config.groupCore', 'API keys'),
    runtime: t('config.groupRuntime', 'Runtime'),
    regional: t('config.groupRegional', 'Regional sources'),
  }[g] || g);
  const renderGroup = (g, fields, opts = {}) => {
    if (!fields.length) return null;
    if (g === 'regional' && !regionalActive && !opts.forceVisible) return null;
    return c('details', {
      open: g !== 'regional',
      style: { marginBottom: '16px' },
    }, [
      c('summary', { style: { fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 0' } },
        groupTitle(g)),
      c('div', { style: { paddingTop: '10px' } }, fields.map(fieldRow)),
    ]);
  };
  const apiPanel = c('div', { className: 'card' }, [
    renderGroup('core',     FIELDS.filter((f) => groupOf(f.key) === 'core'),     { forceVisible: true }),
    renderGroup('runtime',  FIELDS.filter((f) => groupOf(f.key) === 'runtime'),  { forceVisible: true }),
    renderGroup('regional', FIELDS.filter((f) => groupOf(f.key) === 'regional')),
    c('div', { className: 'flex gap-3' }, [
      c('button', {
        className: 'btn btn-primary',
        onClick: (e) => save(e.currentTarget),
      }, '💾 ' + t('common.save', 'Save')),
      c('a', {
        href: '#/health',
        className: 'btn btn-ghost',
      }, t('config.gotoHealth', 'Verify on Health')),
    ]),
  ]);

  const profilePanel = c('div', { className: 'card' }, [
    c('p', { style: { color: 'var(--foggy)', fontSize: '13px', margin: '0 0 12px' } },
      t('config.profileHint',
        'Edits write to config/profile.yml in the parent project. Header is added automatically.')),
    profileTextarea,
    c('div', { className: 'flex gap-3 mt-3' }, [
      c('button', {
        className: 'btn btn-primary',
        onClick: (e) => saveProfile(e.currentTarget),
      }, '💾 ' + t('common.save', 'Save')),
      c('a', { href: '#/profile', className: 'btn btn-ghost' },
        t('config.viewProfile', 'View read-only summary →')),
    ]),
  ]);

  // ─── G-008 (v1.15.0) — Modes tab: editor for modes/_profile.md ───
  // This is the canonical "Career framing" file per career-ops.org Quick
  // Start §Step-5 (Target Roles, Adaptive Framing, Exit Narrative, Comp
  // Targets, Location Policy). Most-edited file per the docs. Until
  // v1.15 it had no UI surface — users had to shell into the parent.
  const modesTextarea = c('textarea', {
    className: 'textarea',
    rows: 24,
    style: { width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '13px', minHeight: '420px' },
    placeholder: '# Career framing (modes/_profile.md)\n\n## Target Roles\n- …',
  });
  let modesLoaded = false;
  let modesScaffolded = false;
  async function loadModesTab() {
    if (modesLoaded) return;
    try {
      const data = await API.get('/api/modes/_profile');
      modesTextarea.value = (data && data.markdown) || '';
      modesScaffolded = !!(data && data.scaffolded);
      modesLoaded = true;
      if (modesScaffolded) {
        UI.toast(t('config.modesScaffolded',
          'Scaffolded from _profile.template.md — review then Save'), 'info');
      }
    } catch (e) {
      modesTextarea.value = '# error: ' + (e.message || e);
    }
  }
  async function saveModes(btn) {
    if (!modesTextarea.value.trim()) {
      UI.toast(t('config.modesEmpty', 'modes/_profile.md is empty'), 'error');
      return;
    }
    try {
      const r = await UI.withSpinner(btn, () =>
        API.put('/api/modes/_profile', { markdown: modesTextarea.value }));
      UI.toast(t('config.modesSaved', 'modes/_profile.md saved') +
        (r.sanitized ? ` (${t('config.sanitized', 'sanitized')})` : ''), 'success');
      modesScaffolded = false;
    } catch (e) {
      UI.toast((e && e.message) || 'failed to save', 'error');
    }
  }

  const modesPanel = c('div', { className: 'card' }, [
    c('p', { style: { color: 'var(--foggy)', fontSize: '13px', margin: '0 0 12px' } },
      t('config.modesHint',
        'modes/_profile.md is your private career framing — never committed to git. Drives every evaluation, deep-research, and outreach prompt.')),
    modesTextarea,
    c('div', { className: 'flex gap-3 mt-3' }, [
      c('button', {
        className: 'btn btn-primary',
        onClick: (e) => saveModes(e.currentTarget),
      }, '💾 ' + t('common.save', 'Save')),
      c('a', { href: 'https://career-ops.org/docs/introduction/what-is-career-ops',
              target: '_blank', rel: 'noopener', className: 'btn btn-ghost' },
        t('config.modesDocsLink', 'Canonical docs ↗')),
    ]),
  ]);

  function tabBtn(label, panel, activate) {
    return c('button', {
      className: 'tab-btn',
      onClick: () => activate(label, panel),
    }, label);
  }

  const tabsHost = c('div', { className: 'card', style: { padding: '8px', marginBottom: '16px' } });
  const panelHost = c('div');

  function activate(label, panel) {
    panelHost.innerHTML = '';
    panelHost.appendChild(panel);
    tabsHost.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('is-active', b.textContent === label);
    });
    if (panel === profilePanel) loadProfileTab();
    if (panel === modesPanel)   loadModesTab();
  }

  const apiLabel = t('config.tabApi', 'API keys & runtime');
  const profileLabel = t('config.tabProfile', 'Profile');
  const modesLabel = t('config.tabModes', 'Modes');
  tabsHost.appendChild(c('div', { className: 'flex gap-3' }, [
    tabBtn(apiLabel, apiPanel, activate),
    tabBtn(profileLabel, profilePanel, activate),
    tabBtn(modesLabel, modesPanel, activate),
  ]));

  // G-008: support deep-linking via /#/config?tab=modes — when the SPA
  // navigates to this view with that query, jump straight to the Modes
  // tab so the "Career framing" card on /#/profile can deep-link to it.
  function tabFromHash() {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('tab=modes')) return modesLabel;
    if (hash.includes('tab=profile')) return profileLabel;
    return apiLabel;
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('config.title', 'App settings')),
        c('p', { className: 'page-subtitle' },
          t('config.subtitle', 'API keys + scanner knobs. Saved to ') + ' ' + (cfg.envFile || '.env')),
      ]),
    ]),

    c('div', { className: 'card', style: { background: '#fff8e6', borderColor: '#f0c674', color: '#8a6300', marginBottom: '20px' } }, [
      c('strong', null, 'ℹ ' + t('config.bannerTitle', 'Both projects pick this up')),
      c('p', { style: { margin: '6px 0 0', fontSize: '14px' } },
        t('config.bannerBody',
          'Saved values land in the parent .env, so career-ops Node scripts AND web-ui (via dotenv loader) read the same source. No restart needed for the running process — env vars are also applied live.')),
    ]),

    tabsHost,
    panelHost,
  ]).also((root) => {
    // Default to the API-keys tab unless the hash deep-links elsewhere.
    const want = tabFromHash();
    const panel = want === modesLabel ? modesPanel
                : want === profileLabel ? profilePanel
                : apiPanel;
    activate(want, panel);
  });
});
