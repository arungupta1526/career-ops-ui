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

    c('div', { className: 'card' }, [
      ...FIELDS.map(fieldRow),
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
    ]),
  ]);
});
