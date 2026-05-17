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
      // v1.39.0 (WS8.2) — explicit provider preference.
      key: 'LLM_PROVIDER', secret: false, kind: 'select',
      options: ['auto', 'claude', 'gemini'], defaultValue: 'auto',
      labelKey: 'config.llmProvider', label: 'LLM_PROVIDER',
      hintKey: 'config.llmProviderHint',
      hintFallback: 'auto = Anthropic then Gemini (default). claude = force Anthropic. gemini = force Gemini. No key for the forced provider → manual-prompt fallback. (Codex/OpenAI is a CLI-side provider — its key is stored below for the parent multi-CLI flow.)',
    },
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
      // v1.39.0 (WS8.2) — Codex / OpenAI-CLI provider key. The parent
      // career-ops multi-CLI flow (Codex / OpenCode) reads this; web-ui
      // live-eval stays Anthropic|Gemini. Stored + masked like the others.
      key: 'OPENAI_API_KEY', secret: true,
      labelKey: 'config.openaiKey', label: 'OPENAI_API_KEY',
      hintKey: 'config.openaiHint',
      hintFallback: 'platform.openai.com → API keys. Used by the Codex / OpenCode CLI side of career-ops (parent multi-CLI flow). web-ui live-eval uses Anthropic or Gemini.',
    },
    // v1.19.0 — HH_USER_AGENT removed from the UI per user direction.
    // The server still honors the env var if a power user sets it via
    // career-ops/.env, but it's no longer advertised through #/config —
    // the bundled default UA in server/lib/sources/hh.mjs handles
    // non-RU IPs well enough for most users.
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
    // v1.20.0 — WCAG 1.3.1 / 3.3.2 association: each input is now
    // wired to its hint via `aria-describedby` and to its label via
    // `id` + `htmlFor`, so screen readers announce the hint text as
    // the input gets focus.
    const inputId = 'cfg-' + spec.key.toLowerCase().replace(/_/g, '-');
    const hintId = inputId + '-hint';
    let input;
    if (spec.kind === 'select') {
      // Dropdown for known-enum fields (model selection).
      // Pre-select the saved value; if unset use the spec's default.
      const current = value || spec.defaultValue || '';
      input = c('select', {
        id: inputId,
        'aria-describedby': hintId,
        className: 'select',
        style: { minWidth: '300px', fontSize: '13px' },
        onChange: () => dirty.add(spec.key),
      }, spec.options.map((opt) => c('option', { value: opt }, opt)));
      input.value = current;
    } else {
      input = c('input', {
        id: inputId,
        'aria-describedby': hintId,
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
      c('label', { htmlFor: inputId, style: { fontWeight: 600, fontSize: '14px' } }, [
        spec.label,
        spec.secret && value
          ? c('span', { style: { marginLeft: '10px', fontSize: '12px', color: 'var(--ok, #008a05)', fontWeight: 'normal' } }, '✓ set')
          : null,
      ]),
      c('p', { id: hintId, style: { color: 'var(--foggy)', fontSize: '13px', margin: '4px 0 8px' } },
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

  // ─── Profile tab — v1.32.0 (WS1): field-by-field form ───
  // Replaces the bare-YAML textarea. 14 scalar paths grouped into
  // Candidate / Narrative / Compensation. Save sends `{ fields: {…} }`
  // → server MERGES (read→set/delete leaf→re-serialize), so arrays
  // (archetypes, proof_points) + unknown keys survive untouched. The
  // raw textarea is retained as a collapsed "Advanced" escape hatch
  // for comment-preservation / complex-array edits.
  const PROFILE_SECTIONS = [
    { titleKey: 'config.pfCandidate', titleFallback: 'Candidate', fields: [
      { path: 'candidate.full_name', lblKey: 'config.pfFullName', lbl: 'Full name' },
      { path: 'candidate.email', lblKey: 'config.pfEmail', lbl: 'Email', type: 'email' },
      { path: 'candidate.phone', lblKey: 'config.pfPhone', lbl: 'Phone' },
      { path: 'candidate.location', lblKey: 'config.pfLocation', lbl: 'Location' },
      { path: 'candidate.linkedin', lblKey: 'config.pfLinkedin', lbl: 'LinkedIn' },
      { path: 'candidate.github', lblKey: 'config.pfGithub', lbl: 'GitHub' },
      { path: 'candidate.portfolio_url', lblKey: 'config.pfPortfolio', lbl: 'Portfolio URL' },
      { path: 'candidate.twitter', lblKey: 'config.pfTwitter', lbl: 'X / Twitter' },
    ] },
    { titleKey: 'config.pfNarrative', titleFallback: 'Narrative', fields: [
      { path: 'narrative.headline', lblKey: 'config.pfHeadline', lbl: 'Headline' },
      { path: 'narrative.exit_story', lblKey: 'config.pfExitStory', lbl: 'Exit story', area: true },
    ] },
    { titleKey: 'config.pfComp', titleFallback: 'Compensation', fields: [
      { path: 'compensation.target_range', lblKey: 'config.pfTargetRange', lbl: 'Target range' },
      { path: 'compensation.currency', lblKey: 'config.pfCurrency', lbl: 'Currency' },
      { path: 'compensation.minimum', lblKey: 'config.pfMinimum', lbl: 'Walk-away minimum' },
      { path: 'compensation.location_flexibility', lblKey: 'config.pfLocFlex', lbl: 'Location flexibility' },
    ] },
  ];
  const pfInputs = {}; // path → input element
  function getDotted(obj, path) {
    return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  }
  const profileTextarea = c('textarea', {
    className: 'textarea',
    rows: 18,
    style: { minHeight: '340px', fontFamily: 'ui-monospace,monospace', fontSize: '13px' },
  });
  let profileLoaded = false;

  function buildProfileForm(profileObj) {
    return PROFILE_SECTIONS.map((sec) =>
      c('details', { open: true, style: { marginBottom: '14px' } }, [
        c('summary', { style: { fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 0' } },
          t(sec.titleKey, sec.titleFallback)),
        c('div', { style: { paddingTop: '8px' } }, sec.fields.map((f) => {
          const id = 'pf-' + f.path.replace(/\./g, '-');
          const cur = getDotted(profileObj, f.path);
          const val = (cur == null) ? '' : String(cur);
          const input = f.area
            ? c('textarea', { id, className: 'textarea', rows: 3 })
            : c('input', { id, className: 'input', type: f.type || 'text' });
          input.value = val;
          pfInputs[f.path] = input;
          return c('div', { className: 'field', style: { marginBottom: '12px' } }, [
            c('label', { htmlFor: id, style: { fontWeight: 600, fontSize: '14px' } }, t(f.lblKey, f.lbl)),
            input,
          ]);
        })),
      ]));
  }

  const pfFormHost = c('div');

  // ── v1.35.0 (WS6.4) — structured array editors ──
  // path → { spec: 'string' | [obj-keys], titleKey, title }. Mirrors
  // the server PROFILE_ARRAY_SPECS allow-list exactly.
  const PROFILE_ARRAYS = [
    { path: 'target_roles.primary', spec: 'string',
      titleKey: 'config.pfPrimaryRoles', title: 'Target roles' },
    { path: 'narrative.superpowers', spec: 'string',
      titleKey: 'config.pfSuperpowers', title: 'Superpowers' },
    { path: 'target_roles.archetypes', spec: ['name', 'level', 'fit'],
      titleKey: 'config.pfArchetypes', title: 'Archetypes' },
    { path: 'narrative.proof_points', spec: ['name', 'url', 'hero_metric'],
      titleKey: 'config.pfProofPoints', title: 'Proof points' },
  ];
  const pfArrayReaders = {}; // path → () => current rows

  function makeArrayEditor(arrSpec, profileObj) {
    const { path, spec } = arrSpec;
    const cur = getDotted(profileObj, path);
    const initial = Array.isArray(cur) ? cur : [];
    const rowsHost = c('div');
    const rowEls = []; // {read: () => value|null}

    function addRow(seed) {
      let read;
      let rowEl;
      const rm = c('button', {
        className: 'btn btn-ghost btn-sm',
        type: 'button',
        'aria-label': t('config.pfRemoveRow', 'Remove row'),
        onClick: () => {
          const i = rowEls.indexOf(holder);
          if (i >= 0) rowEls.splice(i, 1);
          rowsHost.removeChild(rowEl);
        },
      }, '✕');
      if (spec === 'string') {
        const inp = c('input', {
          className: 'input', type: 'text',
          'aria-label': t(arrSpec.titleKey, arrSpec.title),
          style: { flex: '1' },
        });
        inp.value = (seed == null) ? '' : String(seed);
        read = () => inp.value.trim() || null;
        rowEl = c('div', { className: 'flex gap-3', style: { marginBottom: '8px', alignItems: 'center' } }, [inp, rm]);
      } else {
        const inps = {};
        const cells = spec.map((k) => {
          const inp = c('input', {
            className: 'input', type: 'text',
            'aria-label': `${t(arrSpec.titleKey, arrSpec.title)} — ${k}`,
            placeholder: k, style: { flex: '1', minWidth: '90px' },
          });
          inp.value = (seed && seed[k] != null) ? String(seed[k]) : '';
          inps[k] = inp;
          return inp;
        });
        read = () => {
          const o = {};
          for (const k of spec) { const v = inps[k].value.trim(); if (v) o[k] = v; }
          return Object.keys(o).length ? o : null;
        };
        rowEl = c('div', { className: 'flex gap-3', style: { marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' } }, [...cells, rm]);
      }
      const holder = { read };
      rowEls.push(holder);
      rowsHost.appendChild(rowEl);
    }

    initial.forEach((v) => addRow(v));

    pfArrayReaders[path] = () => rowEls.map((r) => r.read()).filter((v) => v != null);

    return c('details', { open: false, style: { marginBottom: '14px' } }, [
      c('summary', { style: { fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 0' } },
        t(arrSpec.titleKey, arrSpec.title)),
      c('div', { style: { paddingTop: '8px' } }, [
        rowsHost,
        c('button', {
          className: 'btn btn-ghost btn-sm', type: 'button',
          onClick: () => addRow(spec === 'string' ? '' : {}),
        }, '+ ' + t('config.pfAddRow', 'Add')),
      ]),
    ]);
  }

  async function loadProfileTab() {
    if (profileLoaded) return;
    try {
      const data = await API.get('/api/profile');
      const obj = (data && data.profile && typeof data.profile === 'object') ? data.profile : {};
      pfFormHost.innerHTML = '';
      for (const k of Object.keys(pfArrayReaders)) delete pfArrayReaders[k];
      buildProfileForm(obj).forEach((n) => pfFormHost.appendChild(n));
      PROFILE_ARRAYS.forEach((a) => pfFormHost.appendChild(makeArrayEditor(a, obj)));
      profileTextarea.value = (data && data.raw) || '';
      profileLoaded = true;
    } catch (e) {
      pfFormHost.innerHTML = '';
      pfFormHost.appendChild(c('p', { style: { color: 'var(--err, #c00)' } },
        t('config.profileLoadErr', 'Could not load profile: ') + (e.message || e)));
    }
  }

  // Field-form save → merge path.
  async function saveProfile(btn) {
    const fieldsPayload = {};
    for (const [path, el] of Object.entries(pfInputs)) fieldsPayload[path] = el.value;
    const fullName = (fieldsPayload['candidate.full_name'] || '').trim();
    if (!fullName) {
      UI.toast(t('config.pfNameRequired', 'Full name is required'), 'error');
      pfInputs['candidate.full_name']?.focus();
      return;
    }
    const arraysPayload = {};
    for (const [path, read] of Object.entries(pfArrayReaders)) arraysPayload[path] = read();
    try {
      const r = await UI.withSpinner(btn, () =>
        API.put('/api/profile', { fields: fieldsPayload, arrays: arraysPayload }));
      UI.toast(t('config.profileSaved', 'Profile saved') +
        (r.candidate ? ` · ${r.candidate}` : ''), 'success');
      // Re-read so arrays / unknown keys the form doesn't model are
      // reflected back into the raw escape-hatch textarea.
      profileLoaded = false;
      await loadProfileTab();
    } catch (e) {
      UI.toast(e.message || 'save failed', 'error');
    }
  }

  // Raw-YAML escape hatch save (advanced).
  async function saveProfileRaw(btn) {
    if (!profileTextarea.value.trim()) {
      UI.toast(t('config.profileEmpty', 'Profile YAML is empty'), 'error');
      return;
    }
    try {
      const r = await UI.withSpinner(btn, () =>
        API.put('/api/profile', { yaml: profileTextarea.value }));
      UI.toast(t('config.profileSaved', 'Profile saved') +
        (r.candidate ? ` · ${r.candidate}` : ''), 'success');
      profileLoaded = false;
      await loadProfileTab();
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
      t('config.profileHintForm',
        'Edit your profile field by field. Saves merge into config/profile.yml — your archetypes, proof points, and any custom keys are preserved untouched.')),
    pfFormHost,
    c('div', { className: 'flex gap-3 mt-3' }, [
      c('button', {
        className: 'btn btn-primary',
        onClick: (e) => saveProfile(e.currentTarget),
      }, '💾 ' + t('common.save', 'Save')),
      c('a', { href: '#/profile', className: 'btn btn-ghost' },
        t('config.viewProfile', 'View read-only summary →')),
    ]),
    // ── Advanced: raw YAML escape hatch (arrays, comments, custom keys) ──
    c('details', { style: { marginTop: '18px' } }, [
      c('summary', { style: { fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--foggy)' } },
        t('config.profileRawToggle', 'Advanced: edit raw YAML (archetypes, proof points, comments)')),
      c('p', { style: { color: 'var(--foggy)', fontSize: '12px', margin: '8px 0' } },
        t('config.profileRawHint',
          'Full YAML editor. Use for nested arrays the field form does not model, or to preserve comments. Replaces the whole file on save.')),
      profileTextarea,
      c('div', { className: 'flex gap-3 mt-3' }, [
        c('button', {
          className: 'btn btn-ghost',
          onClick: (e) => saveProfileRaw(e.currentTarget),
        }, '💾 ' + t('config.profileRawSave', 'Save raw YAML')),
      ]),
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
  // v1.36.0 (WS6.3) — per-section editor. `_profile.md` is a
  // prompt-engineering doc (markdown tables + prose), so section-level
  // editing (one focused textarea per `##` heading) is the right
  // granularity — NOT field decomposition. The server merges by
  // heading: preamble + unknown sections + order survive untouched.
  const modesSectionHost = c('div');
  const modesSectionInputs = {}; // heading → textarea

  function buildSectionEditors(sections) {
    modesSectionHost.innerHTML = '';
    for (const k of Object.keys(modesSectionInputs)) delete modesSectionInputs[k];
    if (!sections || !sections.length) {
      modesSectionHost.appendChild(c('p', { style: { color: 'var(--foggy)', fontSize: '13px' } },
        t('config.modesNoSections', 'No ## sections found — use the raw editor below.')));
      return;
    }
    sections.forEach((s) => {
      const ta = c('textarea', {
        className: 'textarea',
        rows: Math.min(16, Math.max(4, (s.body || '').split('\n').length + 1)),
        style: { width: '100%', fontFamily: 'ui-monospace,monospace', fontSize: '13px' },
        'aria-label': s.heading,
      });
      ta.value = s.body || '';
      modesSectionInputs[s.heading] = ta;
      modesSectionHost.appendChild(c('details', { open: false, style: { marginBottom: '12px' } }, [
        c('summary', { style: { fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 0' } },
          '## ' + s.heading),
        c('div', { style: { paddingTop: '8px' } }, [ta]),
      ]));
    });
  }

  async function loadModesTab() {
    if (modesLoaded) return;
    try {
      const data = await API.get('/api/modes/_profile');
      modesTextarea.value = (data && data.markdown) || '';
      buildSectionEditors((data && data.sections) || []);
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

  // Per-section save → merge path (preamble + unknown sections survive).
  async function saveModes(btn) {
    const sectionsPayload = {};
    for (const [h, ta] of Object.entries(modesSectionInputs)) sectionsPayload[h] = ta.value;
    if (!Object.keys(sectionsPayload).length) {
      UI.toast(t('config.modesNoSections', 'No ## sections found — use the raw editor below.'), 'error');
      return;
    }
    try {
      const r = await UI.withSpinner(btn, () =>
        API.put('/api/modes/_profile', { sections: sectionsPayload }));
      UI.toast(t('config.modesSaved', 'modes/_profile.md saved') +
        (r.sanitized ? ` (${t('config.sanitized', 'sanitized')})` : ''), 'success');
      modesScaffolded = false;
      modesLoaded = false;
      await loadModesTab();
    } catch (e) {
      UI.toast((e && e.message) || 'failed to save', 'error');
    }
  }

  // Raw-markdown escape hatch (add/remove sections, preamble edits).
  async function saveModesRaw(btn) {
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
      modesLoaded = false;
      await loadModesTab();
    } catch (e) {
      UI.toast((e && e.message) || 'failed to save', 'error');
    }
  }

  const modesPanel = c('div', { className: 'card' }, [
    c('p', { style: { color: 'var(--foggy)', fontSize: '13px', margin: '0 0 12px' } },
      t('config.modesHint',
        'modes/_profile.md is your private career framing — never committed to git. Drives every evaluation, deep-research, and outreach prompt.')),
    c('p', { style: { color: 'var(--foggy)', fontSize: '12px', margin: '0 0 12px' } },
      t('config.modesSectionHint',
        'Each ## section is editable on its own below. Saving merges by section — your preamble and any sections you do not touch are preserved.')),
    modesSectionHost,
    c('div', { className: 'flex gap-3 mt-3' }, [
      c('button', {
        className: 'btn btn-primary',
        onClick: (e) => saveModes(e.currentTarget),
      }, '💾 ' + t('common.save', 'Save')),
      c('a', { href: 'https://career-ops.org/docs/introduction/what-is-career-ops',
              target: '_blank', rel: 'noopener', className: 'btn btn-ghost' },
        t('config.modesDocsLink', 'Canonical docs ↗')),
    ]),
    c('details', { style: { marginTop: '18px' } }, [
      c('summary', { style: { fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--foggy)' } },
        t('config.modesRawToggle', 'Advanced: edit raw markdown (add/remove sections, preamble)')),
      c('p', { style: { color: 'var(--foggy)', fontSize: '12px', margin: '8px 0' } },
        t('config.modesRawHint',
          'Full-file editor. Use to add or remove ## sections or edit the preamble. Replaces the whole file on save.')),
      modesTextarea,
      c('div', { className: 'flex gap-3 mt-3' }, [
        c('button', {
          className: 'btn btn-ghost',
          onClick: (e) => saveModesRaw(e.currentTarget),
        }, '💾 ' + t('config.modesRawSave', 'Save raw markdown')),
      ]),
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

  const root = c('div', null, [
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
  ]);

  // v1.24.1 (G-015) — was `.also((root) => …)` via Element.prototype.also,
  // dropped by v1.22.0 N-2 without migrating this view (cv.js was migrated
  // at the time; config.js was missed and crashed `#/config` on all 8
  // locales with "c(...).also is not a function"). Default to the
  // API-keys tab unless the hash deep-links to Profile or Modes.
  {
    const want = tabFromHash();
    const panel = want === modesLabel ? modesPanel
                : want === profileLabel ? profilePanel
                : apiPanel;
    activate(want, panel);
  }

  return root;
});
