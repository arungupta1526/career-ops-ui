/**
 * v1.58.0 — regression guards for the external QA report fixes.
 *
 * Browser-only files (api.js, mode-page.js, router.js, views) are
 * asserted statically (the project's router.test/openai-model-selector
 * pattern). checkProfileCustomized is importable → exercised directly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __d = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(resolve(__d, '..', ...p), 'utf8');

test('BUG-003: UI.md() runs inline() on block-quote lines (bold/code/links render)', () => {
  const src = read('public', 'js', 'api.js');
  // the blockquote replacement must map through inline(), not raw text
  assert.match(src, /<blockquote>'\s*\+\s*block\.split\('\\n'\)\.map\(\(l\)\s*=>\s*inline\(l\.replace/);
});

test('BUG-007/008: UI exposes dismissToast; health view dismisses + reuses button label as modal title', () => {
  const api = read('public', 'js', 'api.js');
  assert.match(api, /function dismissToast\(\)/);
  assert.match(api, /return \{ toast, dismissToast, modal,/);
  const health = read('public', 'js', 'views', 'health.js');
  // v1.58.27 (U-7) introduced an intermediate `const stripped = …` line
  // between `UI.dismissToast()` and `UI.modal(t('health.verify'), …)`
  // in the verify handler. The BUG-007/008 contract is still satisfied:
  // dismissToast runs BEFORE modal, and the title is the localized key,
  // not the hardcoded 'doctor'. Loosen the regex from strict adjacency
  // (\n\s*) to "dismissToast call appears before modal(t('…'))" within
  // a small text window.
  assert.match(health, /UI\.dismissToast\(\);[\s\S]{0,1200}?UI\.modal\(t\('health\.runDoctor'\)/);
  assert.match(health, /UI\.dismissToast\(\);[\s\S]{0,1200}?UI\.modal\(t\('health\.verify'\)/);
  assert.ok(!/UI\.modal\('doctor'/.test(health), "modal title must not be the hardcoded lowercase 'doctor'");
});

test('U-12 (v1.58.32): help TOC filter input carries `.help-toc__filter` class + CSS min-width', () => {
  const help = read('public', 'js', 'views', 'help.js');
  assert.match(help, /className:\s*'input help-toc__filter'/,
    'tocSearch must carry className "input help-toc__filter"');
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.help-toc__filter\s*\{[^}]*min-width:\s*16ch/,
    '.help-toc__filter must declare min-width: 16ch (fits all 8 locale placeholders)');
});

test('U-11 (v1.58.31): tracker Legitimacy column header has localized info chip with tooltip', () => {
  const tr = read('public', 'js', 'views', 'tracker.js');
  assert.match(tr, /className:\s*'th-info'/, '<span class="th-info"> must exist in the legitimacy header');
  assert.match(tr, /tabIndex:\s*0/, 'info chip must be keyboard-reachable (tabIndex: 0)');
  assert.match(tr, /title:\s*t\('track\.col\.legitimacy\.help'/,
    "info chip must declare title: t('track.col.legitimacy.help', …)");
  assert.match(tr, /'aria-label':\s*t\('track\.col\.legitimacy\.help'/,
    "info chip must declare aria-label: t('track.col.legitimacy.help', …)");
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'track\.col\.legitimacy\.help':\s*\{([^}]+)\}/);
  assert.ok(row, "i18n-dict.js missing 'track.col.legitimacy.help'");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'track.col.legitimacy.help' must have a non-empty ${lang} value`);
  }
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.th-info\s*\{/, '.th-info CSS rule must exist');
  assert.match(css, /\.th-info:focus-visible\s*\{/, '.th-info:focus-visible rule must exist (keyboard ring)');
});

test('U-10 (v1.58.30): tracker Normalize/Dedup/Merge buttons disabled when rows is empty', () => {
  const tr = read('public', 'js', 'views', 'tracker.js');
  assert.match(tr, /const empty = rows\.length === 0;/,
    'tracker must compute the empty flag from rows.length === 0');
  assert.match(tr, /disabled:\s*empty/, 'each button must declare disabled: empty');
  assert.match(tr, /'aria-disabled':\s*empty\s*\?\s*'true'\s*:\s*'false'/,
    "each button must declare aria-disabled mirroring the disabled state");
  assert.match(tr, /t\('track\.fixEmpty'/, 'empty tooltip must come from t("track.fixEmpty", …)');
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'track\.fixEmpty':\s*\{([^}]+)\}/);
  assert.ok(row, "i18n-dict.js missing 'track.fixEmpty'");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'track.fixEmpty' must have a non-empty ${lang} value`);
  }
});

test('U-9 (v1.58.29): pipeline counter ↔ filter row stacks at narrow viewports via .pipeline-controls', () => {
  const pipeline = read('public', 'js', 'views', 'pipeline.js');
  assert.match(pipeline, /className:\s*'flex gap-3 mb-3 pipeline-controls'/,
    'pipeline counter/filter row must carry the .pipeline-controls class');
  const css = read('public', 'css', 'app.css');
  assert.match(css, /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.pipeline-controls\s*\{[^}]*flex-direction:\s*column/,
    '@media (max-width: 720px) must stack .pipeline-controls');
});

test('U-8 (v1.58.28): mode-page Generate-prompt wraps the <pre> in a collapsible <details>', () => {
  const mp = read('public', 'js', 'views', 'mode-page.js');
  assert.match(mp, /c\('details',\s*\{\s*className:\s*'prompt-block'\s*\}/,
    "showPrompt must wrap the prompt in <details class=\"prompt-block\">");
  assert.match(mp, /c\('summary',\s*null,\s*t\('prompt\.show'/,
    "showPrompt must use t('prompt.show', …) for the summary label");
  assert.match(mp, /t\('prompt\.lines'/,
    "showPrompt must localize the 'lines' word too");
  // i18n parity for the two new keys:
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  for (const key of ['prompt.show', 'prompt.lines']) {
    const row = dict.match(new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*\\{([^}]+)\\}`));
    assert.ok(row, `i18n-dict.js missing '${key}'`);
    for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
      const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
      assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
        `'${key}' must have a non-empty ${lang} value`);
    }
  }
  // CSS rule must exist:
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.prompt-block\s*\{/, '.prompt-block rule must exist');
  assert.match(css, /\.prompt-block\s*>\s*summary\s*\{/, '.prompt-block > summary rule must exist');
});

test('U-7 (v1.58.27): verify-pipeline modal strips `==========` ASCII dividers', () => {
  const health = read('public', 'js', 'views', 'health.js');
  assert.match(health, /\.replace\(\/\^=\{10,\}\$\/gm,\s*''\)/,
    "verify handler must strip lines that are >=10 '=' chars before rendering");
});

test('U-6 (v1.58.26): scan Active-companies chip exposes localized tooltip + aria-label', () => {
  const scan = read('public', 'js', 'views', 'scan.js');
  // toggleBtn must declare both title and aria-label so sighted users
  // get a hover tooltip and screen-reader users get the same text.
  assert.match(scan, /title:\s*t\('scan\.activeCo\.help'/,
    'toggleBtn must declare title: t("scan.activeCo.help", …)');
  assert.match(scan, /'aria-label':\s*t\('scan\.activeCo\.help'/,
    'toggleBtn must declare aria-label: t("scan.activeCo.help", …)');

  // i18n parity:
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'scan\.activeCo\.help':\s*\{([^}]+)\}/);
  assert.ok(row, "i18n-dict.js missing 'scan.activeCo.help'");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'scan.activeCo.help' must have a non-empty ${lang} value`);
  }
});

test('U-5 (v1.58.25): dashboard CTA duplicates removed (no `Open Pipeline` header btn, no `Scan all sources` tile)', () => {
  const dash = read('public', 'js', 'views', 'dashboard.js');
  // Pre-fix the header carried '📋 ' + t('dash.openPipeline'); that
  // button must be gone (sidebar handles /pipeline already).
  assert.ok(
    !/onClick:\s*\(\)\s*=>\s*Router\.go\('\/pipeline'\)\s*\}\s*,\s*'📋 '\s*\+\s*t\('dash\.openPipeline'\)/.test(dash),
    "'Open Pipeline' header button must be removed (duplicates sidebar /pipeline)",
  );
  // Pre-fix qa('🌐', 'dash.quick.scanCta', 'Scan all sources', …, '/scan')
  // duplicated the hero 'Scan now' CTA. It must be removed too.
  assert.ok(
    !/qa\('🌐',\s*'dash\.quick\.scanCta'/.test(dash),
    "'Scan all sources' Quick-action tile must be removed (duplicates hero Scan-now CTA)",
  );
  // Negative-count: the unique `Router.go('/pipeline')` and
  // `Router.go('/scan')` references should be ≤ 2 each on the dashboard
  // (hero + Quick-action Pipeline tile for /pipeline; hero only for /scan).
  const pipelineRefs = [...dash.matchAll(/Router\.go\('\/pipeline'\)/g)].length;
  const scanRefs = [...dash.matchAll(/Router\.go\('\/scan'\)/g)].length;
  assert.ok(pipelineRefs <= 2,
    `dashboard.js should have at most 2 Router.go('/pipeline') sites, found ${pipelineRefs}`);
  assert.ok(scanRefs <= 2,
    `dashboard.js should have at most 2 Router.go('/scan') sites, found ${scanRefs}`);
});

test('U-4 (v1.58.24): toast splits the "(METHOD /path · HTTP NNN)" postfix into a collapsible <details>', () => {
  const api = read('public', 'js', 'api.js');
  // Toast renderer must define the endpoint-detail regex:
  assert.match(api, /TOAST_ENDPOINT_RE\s*=\s*\/.*GET\|POST\|PUT\|PATCH\|DELETE.*HTTP/,
    'TOAST_ENDPOINT_RE must exist and match METHOD /path · HTTP NNN');
  // Headline + detail must be emitted as separate DOM nodes:
  assert.match(api, /createElement\('p'\)/, 'toast must create a <p> for the headline');
  assert.match(api, /createElement\('details'\)/, 'toast must create a <details> for the technical detail');
  assert.match(api, /createElement\('summary'\)/, 'toast must create a <summary>');
  assert.match(api, /I18n\.t\('toast\.details',\s*'Details'\)/,
    "summary must use I18n.t('toast.details', 'Details')");

  // i18n parity for toast.details:
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'toast\.details':\s*\{([^}]+)\}/);
  assert.ok(row, "i18n-dict.js missing 'toast.details'");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'toast.details' must have a non-empty ${lang} value`);
  }

  // CSS contract — collapsible block exists:
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.toast\s+\.toast-detail\s*\{/, '.toast .toast-detail rule must exist');
  assert.match(css, /\.toast\s+\.toast-detail\s+>\s+code\s*\{/, '.toast .toast-detail > code rule must exist');
});

test('U-3 (v1.58.23): #/followup lastContact placeholder is computed as today − 14 days', () => {
  const mp = read('public', 'js', 'views', 'mode-page.js');
  // The placeholder for followup.lastContact must be computed at render
  // time from `new Date()` minus 14 days, not read from i18n directly.
  assert.match(
    mp,
    /cfg\.slug === 'followup' && spec\.name === 'lastContact'/,
    'mode-page.js must special-case followup.lastContact for dynamic placeholder',
  );
  assert.match(
    mp,
    /d\.setDate\(d\.getDate\(\) - 14\)/,
    'placeholder must subtract 14 days',
  );
  assert.match(
    mp,
    /d\.toISOString\(\)\.slice\(0,\s*10\)/,
    'placeholder must format as ISO YYYY-MM-DD via toISOString().slice(0, 10)',
  );
});

test('U-2 (v1.58.22): #/auto separates ✨ from the H1 via a .page-icon span', () => {
  const auto = read('public', 'js', 'views', 'auto.js');
  // Header must use the icon variant + emoji as a sibling span:
  assert.match(auto, /className:\s*'page-header page-header--icon'/,
    "auto.js header must use 'page-header page-header--icon'");
  assert.match(auto, /c\('span',\s*\{\s*className:\s*'page-icon',\s*'aria-hidden':\s*'true'\s*\},\s*'✨'\)/,
    'auto.js must emit ✨ as a separate <span class="page-icon" aria-hidden="true">');
  // The H1 i18n value must NOT include the leading ✨ anymore:
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'auto\.title':\s*\{([^}]+)\}/);
  assert.ok(row, 'auto.title row must exist');
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    const m = row[1].match(new RegExp(`${keyPat}\\s*:\\s*'([^']+)'`));
    assert.ok(m, `auto.title row missing ${lang}`);
    assert.ok(!/^✨/.test(m[1]),
      `auto.title[${lang}] must not start with ✨ (moved to .page-icon span): '${m[1]}'`);
  }
  // CSS must define the grid header + icon class:
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.page-header--icon\s*\{[^}]*display:\s*grid/,
    '.page-header--icon must declare display: grid');
  assert.match(css, /\.page-icon\s*\{[^}]*line-height:\s*1/,
    '.page-icon rule must exist');
});

test('U-1 (v1.58.21): #/cv has a proper page-header H1 + subtitle (no `.cv-breadcrumb` chip)', () => {
  const cv = read('public', 'js', 'views', 'cv.js');
  // Pre-fix chip class is gone:
  assert.ok(!/className:\s*'page-title cv-breadcrumb'/.test(cv),
    "'.cv-breadcrumb' chip class must be removed");
  // New H1 + subtitle pair:
  assert.match(cv, /c\('h1',\s*\{\s*className:\s*'page-title'\s*\},\s*t\('cv\.title'\)\)/,
    "cv.js must render <h1 class=\"page-title\">{t('cv.title')}</h1>");
  assert.match(cv, /c\('p',\s*\{\s*className:\s*'page-subtitle'\s*\},\s*t\('cv\.subtitle'\)\)/,
    "cv.js must render <p class=\"page-subtitle\">{t('cv.subtitle')}</p>");
  // Single-H1 invariant still holds — cv.js has exactly one h1 occurrence in the header.
  const h1Count = (cv.match(/c\('h1'/g) || []).length;
  assert.equal(h1Count, 1, `cv.js must declare exactly one <h1>, got ${h1Count}`);
});

test('I-6 (v1.58.20): footer hotkey uses {hotkey} placeholder + per-platform substitution', () => {
  // v1.58.3 footer showed 'CTRL+K — search' literally on every platform
  // and locale. The i18n value now embeds {hotkey} so app.js can swap
  // it to ⌘K on Mac and Ctrl+K elsewhere; the localized verb stays.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  assert.match(dict, /'top\.langhint':\s*\{\s*en:\s*'\{hotkey\} — search'/,
    "top.langhint EN must use '{hotkey} — search'");
  for (const lang of ['es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const quotedKey = /-/.test(lang) ? `'${lang}'` : lang;
    assert.match(dict, new RegExp(`${quotedKey.replace(/[\.]/g, '\\.')}:\\s*'\\{hotkey\\} — [^']+'`),
      `top.langhint ${lang} must use '{hotkey} — <verb>' shape`);
  }
  // app.js must apply the platform-specific substitution.
  const app = read('public', 'js', 'app.js');
  assert.match(app, /applyFooterHotkey/, 'app.js must define applyFooterHotkey()');
  assert.match(app, /isMac\s*\?\s*'⌘K'\s*:\s*'Ctrl\+K'/,
    'applyFooterHotkey must branch ⌘K vs Ctrl+K');
  assert.match(app, /\.replace\(\/\\\{hotkey\\\}\/g,\s*hotkey\)/,
    "applyFooterHotkey must substitute {hotkey} placeholder");
  assert.match(app, /I18n\.onChange\(applyFooterHotkey\)/,
    'applyFooterHotkey must re-run on every language change');
});

test('I-4 (v1.58.19): RU followup strings contain no Latin `cadence`/`follow-up` leakage', () => {
  // v1.58.3: RU `#/followup` H1 was 'Советник по cadence follow-up'; subtitle
  // 'ISO-дата (YYYY-MM-DD) — основа для cadence.'. Translate.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const ruFollowup = dict.split('\n')
    .filter((l) => /^\s*'followup\./.test(l))
    .map((l) => {
      const m = l.match(/ru:\s*'([^']+)'/);
      return m ? m[1] : null;
    })
    .filter(Boolean);
  assert.ok(ruFollowup.length >= 10, 'should find ≥ 10 followup.* RU strings');
  for (const s of ruFollowup) {
    assert.ok(!/\bcadence\b/i.test(s),
      `RU followup string must not contain 'cadence': ${s}`);
    assert.ok(!/\bfollow-up\b/i.test(s),
      `RU followup string must not contain 'follow-up': ${s}`);
  }
});

test('I-3 (v1.58.18): help TOC items 2/5/13/14 contain no Latin English bleed in non-Latin locales', () => {
  // v1.58.3 regression: '## 2. App settings & API keys', '## 5. Portals
  // & Sources', '## 13. Mode prompts', '## 14. Apply checklist' bled
  // English into ru / ja / ko / zh-CN / zh-TW help bundles. Items 2,
  // 5, 13, 14 must now contain no top-level English glossary terms
  // (App, settings, Apply, checklist, Portals, Sources, Mode, prompts)
  // in those 5 locales.
  const banned = /\b(App|settings|Apply|checklist|Portals|Sources|Mode|prompts)\b/;
  for (const locale of ['ru', 'ja', 'ko-KR', 'zh-CN', 'zh-TW']) {
    const text = read('docs', 'help', `${locale}.md`);
    for (const n of [2, 5, 13, 14]) {
      const re = new RegExp(`^## ${n}\\. (.+)$`, 'm');
      const m = text.match(re);
      assert.ok(m, `${locale}.md missing H2 item ${n}`);
      assert.ok(!banned.test(m[1]),
        `${locale}.md H2 item ${n} still contains English: ${m[1]}`);
    }
  }
});

test('I-2 (v1.58.17): formatRelative uses Intl.RelativeTimeFormat with the active locale', () => {
  const deep = read('public', 'js', 'views', 'deep.js');
  // The pre-fix hardcoded English strings are gone:
  assert.ok(!/return 'today';\s*\n\s*if \(days === 1\) return '1d ago'/.test(deep),
    "pre-fix hardcoded 'today' / '1d ago' / 'Nd ago' must be removed");
  // The new path must call Intl.RelativeTimeFormat with I18n.getLang() and numeric:auto:
  assert.match(deep, /new Intl\.RelativeTimeFormat\(locale,\s*\{\s*numeric:\s*'auto'\s*\}\)/,
    'formatRelative must use Intl.RelativeTimeFormat(locale, { numeric: "auto" })');
  assert.match(deep, /I18n\.getLang\(\)/,
    'formatRelative must read the active locale from I18n.getLang()');
  // Older dates fall back to a localized absolute via Intl.DateTimeFormat:
  assert.match(deep, /new Intl\.DateTimeFormat\(locale,\s*\{\s*dateStyle:\s*'medium'\s*\}\)/,
    'formatRelative must fall back to Intl.DateTimeFormat(locale, { dateStyle: "medium" })');
});

test('v1.58.16: btn-primary/btn-danger hover no longer flickers (gradient stays, filter dims)', () => {
  // Pre-fix the default background was a gradient and the :hover state
  // replaced it with a solid colour. CSS can't smoothly transition
  // gradient ↔ solid, so the 180ms transition snapped and the user
  // perceived a brief flash. The new rule keeps the gradient on hover
  // and dims via `filter: brightness(...)`, which interpolates cleanly.
  const css = read('public', 'css', 'app.css');
  // Pre-fix solid-background hover must be gone:
  assert.ok(
    !/\.btn-primary:hover\s*\{\s*background:\s*var\(--rausch-dark\)/.test(css),
    "'.btn-primary:hover' must not swap the gradient for a solid background"
  );
  assert.ok(
    !/\.btn-danger:hover\s*\{\s*background:\s*var\(--rausch-dark\)/.test(css),
    "'.btn-danger:hover' must not swap the gradient for a solid background"
  );
  // New filter-based hover must be present on both:
  assert.match(css, /\.btn-primary:hover\s*\{[^}]*filter:\s*brightness\(/,
    "'.btn-primary:hover' must dim via filter: brightness()");
  assert.match(css, /\.btn-danger:hover\s*\{[^}]*filter:\s*brightness\(/,
    "'.btn-danger:hover' must dim via filter: brightness()");
  // And `filter` must be in `.btn`'s transition list so the dim animates.
  assert.match(css, /\.btn\s*\{\s*transition:[^}]*filter\s+var\(--transition\)/m,
    '.btn transition must include `filter var(--transition)` so hover dim animates');
});

test('I-1 (v1.58.15): top-bar search aria-label + visually-hidden label are localized via data-i18n', () => {
  const html = read('public', 'index.html');
  // The visually-hidden <label> for the search input must declare its
  // i18n key so applyI18n() can swap the text on language change.
  assert.match(
    html,
    /<label for="global-search"[^>]*data-i18n="top\.search\.label"/,
    'visually-hidden label for #global-search must use data-i18n="top.search.label"'
  );
  // The input's aria-label must use the new data-i18n-aria-label hook.
  assert.match(
    html,
    /id="global-search"[\s\S]{0,400}?data-i18n-aria-label="top\.search\.aria"/,
    '#global-search must declare data-i18n-aria-label="top.search.aria"'
  );

  // app.js must process data-i18n-aria-label alongside data-i18n /
  // data-i18n-placeholder so the attribute actually swaps on lang
  // change (the contract is symmetric).
  const app = read('public', 'js', 'app.js');
  assert.match(
    app,
    /document\.querySelectorAll\('\[data-i18n-aria-label\]'\)\.forEach/,
    'applyI18n() must iterate [data-i18n-aria-label] and apply aria-label'
  );
  assert.match(
    app,
    /el\.setAttribute\('aria-label',\s*I18n\.t\(key,/,
    'data-i18n-aria-label handler must call el.setAttribute(aria-label, I18n.t(key, …))'
  );

  // i18n parity — both new keys present + non-trivially translated
  // (at least one non-EN locale differs from EN so the test catches a
  // fresh-add that forgot to translate).
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  for (const key of ['top.search.label', 'top.search.aria']) {
    const re = new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*\\{([^}]*)\\}`);
    const row = dict.match(re);
    assert.ok(row, `i18n-dict.js missing '${key}'`);
    for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
      const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
      assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
        `'${key}' must have a non-empty ${lang} value`);
    }
    // Sanity — at least one CJK / Cyrillic locale must differ from EN
    // (catches the accidental copy-paste-EN bug).
    const enM = row[1].match(/\ben:\s*['"]([^'"]+)['"]/);
    const ruM = row[1].match(/\bru:\s*['"]([^'"]+)['"]/);
    assert.ok(enM && ruM && enM[1] !== ruM[1],
      `'${key}' must have a non-English Russian translation`);
  }
});

test('M-9 (v1.58.14): connection-banner Refresh emits a localized toast (no silent reload)', () => {
  const app = read('public', 'js', 'app.js');
  // Click handler must show the in-flight toast (synchronous before
  // the reload steals the page).
  assert.match(app, /UI\.toast\(I18n\.t\('common\.refreshing',/,
    "Refresh click must show t('common.refreshing', …) before reload");
  // Reload must be deferred via setTimeout so the toast paints before
  // navigation; immediate location.reload() would swallow the toast.
  assert.match(app, /setTimeout\(\(\)\s*=>\s*location\.reload\(\),\s*\d+\)/,
    'Refresh reload must be deferred via setTimeout');
  // Per-button disabled guard prevents toast stacking on rapid clicks.
  assert.match(app, /refreshBtn\.disabled\s*=\s*true/,
    'Refresh button must disable itself to swallow rapid double-clicks');
  // sessionStorage handoff so the success toast survives the navigation.
  assert.match(app, /sessionStorage\.setItem\('refreshedToast'/,
    "Refresh must set sessionStorage['refreshedToast'] before reload");
  assert.match(app, /sessionStorage\.getItem\('refreshedToast'\)/,
    'next page boot must check sessionStorage for the pending toast');
  assert.match(app, /UI\.toast\(I18n\.t\('common\.refreshed',[^)]*\),\s*'success'\)/,
    "next page boot must emit t('common.refreshed', …) as a success toast");
  // Pre-fix silent `location.reload()` direct call (no toast, no
  // sessionStorage) must be gone.
  assert.ok(
    !/conn-refresh-btn[^\n]*addEventListener\('click',\s*\(\)\s*=>\s*location\.reload\(\)\)/.test(app),
    'pre-fix silent location.reload() handler must be replaced'
  );

  // i18n parity — both new keys present in all 8 locales.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  for (const key of ['common.refreshing', 'common.refreshed']) {
    const re = new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*\\{([^}]*)\\}`);
    const row = dict.match(re);
    assert.ok(row, `i18n-dict.js missing '${key}'`);
    for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
      const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
      assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
        `'${key}' must have a non-empty ${lang} value`);
    }
  }
});

test('M-8 (v1.58.13): apply checklist renders interactive checkboxes + persists per URL', () => {
  const apply = read('public', 'js', 'views', 'apply.js');
  // Items render as real <input type="checkbox"> with index data attr.
  assert.match(apply, /type:\s*'checkbox'.*data-item-index/s,
    "apply.js must render each checklist item as <input type='checkbox' data-item-index=…>");
  // Each row uses a <label> wrapping checkbox + span so the click
  // target covers the full row (WCAG 2.5.5 / M-1 focus-visible).
  assert.match(apply, /c\('label',\s*null,\s*\[cb,\s*c\('span'/,
    'apply.js must wrap each checklist item in <label> for full-row click target');
  // State is persisted under the per-URL slug in localStorage.
  assert.match(apply, /STORAGE_PREFIX\s*=\s*'applyChecklist:'/,
    'apply.js must use the canonical applyChecklist: localStorage prefix');
  assert.match(apply, /function loadState\(/,
    'apply.js must define loadState() to rehydrate ticks across reloads');
  assert.match(apply, /function saveState\(/,
    'apply.js must define saveState() to persist ticks on every change');
  // Copy-unchecked and Reset buttons must be present.
  assert.match(apply, /t\('apply\.checklist\.copyUnchecked'/,
    'apply.js must use t(apply.checklist.copyUnchecked, ...) for the copy button');
  assert.match(apply, /t\('apply\.checklist\.resetBtn'/,
    'apply.js must use t(apply.checklist.resetBtn, ...) for the reset button');
  // Pre-fix raw <pre>…r.checklist…</pre> must be gone from the main
  // path (kept only as a defensive fallback when parseChecklist→0).
  assert.ok(
    !/c\('pre',\s*\{\s*className:\s*'console'\s*\},\s*r\.checklist\)\)/.test(apply),
    "apply.js must not render r.checklist as a plain <pre> in the happy path"
  );

  // CSS must define .apply-checklist with full-row click target sizing.
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.apply-checklist\s*\{/, 'app.css must define .apply-checklist');
  assert.match(css, /\.apply-checklist label\s*\{[^}]*min-height:\s*32px/m,
    '.apply-checklist label must have min-height ≥32px for click-target');
  assert.match(css, /\.apply-checklist__actions\b/,
    '.apply-checklist__actions container must be defined');

  // i18n parity — all 5 new checklist keys present in all 8 locales.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  for (const key of [
    'apply.checklist.copyUnchecked',
    'apply.checklist.resetBtn',
    'apply.checklist.copied',
    'apply.checklist.copyFailed',
    'apply.checklist.reset',
  ]) {
    const re = new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*\\{([^}]*)\\}`);
    const row = dict.match(re);
    assert.ok(row, `i18n-dict.js missing '${key}'`);
    for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
      const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
      assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
        `'${key}' must have a non-empty ${lang} value`);
    }
  }
});

test('M-7 (v1.58.12): cost hint follows active provider; OpenRouter + null-cost path handled', () => {
  const api = read('public', 'js', 'api.js');
  // The EST map must include openrouter (was previously absent → fell
  // through to a generic 0.03 fallback that misrepresented the cost).
  assert.match(api, /EST\s*=\s*\{[^}]*openrouter:\s*null/m,
    'EST map must include openrouter with null (router picks → cost varies)');
  // The NAME map must also know about openrouter so the visible name
  // isn't the lowercase literal 'openrouter'.
  assert.match(api, /NAME\s*=\s*\{[^}]*openrouter:\s*'OpenRouter'/m,
    "NAME map must map openrouter → 'OpenRouter'");
  // The render path must branch on null cost and emit cost.varies
  // (no fabricated hard number for router-picks providers).
  assert.match(api, /EST\[st\.activeProvider\]\s*===\s*null/,
    'render path must branch on EST[active] === null');
  assert.match(api, /tr\('cost\.varies',\s*'cost varies/,
    "render path must use t('cost.varies', 'cost varies …') for the null-cost case");
  // i18n parity — cost.varies present in all 8 locales.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'cost\.varies':\s*\{([^}]*)\}/);
  assert.ok(row, "i18n-dict.js missing 'cost.varies'");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'cost.varies' must have a non-empty ${lang} value`);
  }
});

test('M-4 (v1.58.11): saved-research card has CSS gap between title and date (no string concat)', () => {
  const deep = read('public', 'js', 'views', 'deep.js');
  // Title and date must be SEPARATE child elements with the new classes,
  // not concatenated strings. The date element must be semantic <time>
  // with a datetime attribute (a11y) — assert all three.
  assert.match(deep, /className: 'saved-card__title'/,
    'saved-research card must have a .saved-card__title element');
  assert.match(deep, /c\('time',\s*\{[^}]*className: 'saved-card__date'[^}]*datetime:/,
    'saved-research date must be a <time class="saved-card__date" datetime=...>');
  // The pre-fix inline marginLeft: 8px must be gone — gap is now structural CSS.
  assert.ok(!/marginLeft: '8px'.*formatRelative/s.test(deep),
    'pre-fix inline marginLeft string-concat must be removed');

  // CSS must define the .saved-card flex container with non-zero gap so
  // a future tweak to the JSX can't reintroduce the collapsed-margin bug.
  const css = read('public', 'css', 'app.css');
  assert.match(css, /\.saved-card\s*\{[^}]*display:\s*inline-flex[^}]*gap:\s*var\(--space-2[^)]*\)/m,
    '.saved-card must declare inline-flex + gap');
  assert.match(css, /\.saved-card__title\b/, 'CSS must define .saved-card__title');
  assert.match(css, /\.saved-card__date\b/,  'CSS must define .saved-card__date');
});

test('M-2 (v1.58.10): UI.modal() drains the progress toast at entry (defence-in-depth)', () => {
  // Health view already calls UI.dismissToast() at every modal-opening
  // site. cv.js's sync-check used to skip it → 'Running …' toast
  // overlapped the result modal. Re-route the drain into UI.modal so
  // every future call site is covered for free.
  const api = read('public', 'js', 'api.js');
  // The new auto-drain must be the FIRST executable statement of modal().
  assert.match(
    api,
    /function modal\(title, html, onClose\)\s*\{[\s\S]{0,1500}?dismissToast\(\);[\s\S]{0,400}?if \(_onClose\)/,
    'UI.modal must call dismissToast() before processing onClose'
  );

  // cv.js sync-check call site is now localized via t('cv.syncCheck',
  // 'sync-check') for both button label and modal title, satisfying the
  // BUG-008 'modal title == localized button label' invariant.
  const cv = read('public', 'js', 'views', 'cv.js');
  assert.match(cv, /UI\.toast\(t\('cv\.syncCheckRunning',/,
    "cv.js sync-check must use t('cv.syncCheckRunning', ...) for the progress toast");
  assert.match(cv, /UI\.modal\(t\('cv\.syncCheck',\s*'sync-check'\),/,
    "cv.js sync-check must use t('cv.syncCheck', 'sync-check') as the modal title");
  assert.ok(!/UI\.toast\('sync-check…'\)/.test(cv),
    "cv.js must not use the hardcoded English 'sync-check…' toast");

  // i18n parity — both keys present in all 8 locales.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  for (const key of ['cv.syncCheck', 'cv.syncCheckRunning']) {
    const re = new RegExp(`'${key.replace('.', '\\.')}':\\s*\\{([^}]*)\\}`);
    const row = dict.match(re);
    assert.ok(row, `i18n-dict.js missing '${key}'`);
    for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
      const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
      assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
        `'${key}' must have a non-empty ${lang} value`);
    }
  }
});

test('M-1 (v1.58.9): form fields get a visible :focus-visible ring (WCAG 2.4.7)', () => {
  // The base .input/.textarea/.select rules in app.css zero `outline`
  // (to avoid mouse-focus ring noise), which silently overrode the
  // global `*:focus-visible` ring on every form field. Re-establish a
  // visible keyboard-only ring at higher specificity than the form-base.
  const css = read('public', 'css', 'app.css');
  // The new rule must declare a visible outline on input/textarea/select focus-visible.
  assert.match(
    css,
    /\.input:focus-visible,\s*\n\s*\.textarea:focus-visible,\s*\n\s*\.select:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rausch[^)]*\)/m,
    'form-field :focus-visible must declare a 2px solid var(--rausch) outline'
  );
  // The searchbar input override (the global ⌘K/Ctrl K search) must also have a focus ring.
  assert.match(
    css,
    /\.searchbar input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rausch[^)]*\)/m,
    'searchbar input :focus-visible must declare a 2px solid var(--rausch) outline'
  );
  // The pre-existing global *:focus-visible ring must still be in place
  // (regression-lock the WCAG 2.4.7 invariant the new rules build on).
  assert.match(
    css,
    /\*:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--rausch[^)]*\)/m,
    'global *:focus-visible ring must remain in place'
  );
});

test('BUG-008-tb: top-bar Doctor modal title equals the localized button label (parity with Health page)', () => {
  // v1.58.6 — pre-fix, app.js passed the hardcoded English 'doctor' as
  // the modal title regardless of locale. Health-page passes
  // t('health.runDoctor'). Both entry-points must follow the
  // ledger BUG-008 invariant: modal-title == localized button label.
  const app = read('public', 'js', 'app.js');
  // The new modal call uses the same i18n key the <button> declares
  // via data-i18n="top.doctor" in index.html.
  assert.match(app, /UI\.modal\(I18n\.t\('top\.doctor', 'Doctor'\),/,
    "top-bar Doctor modal must look up t('top.doctor', 'Doctor') as its title");
  assert.ok(!/UI\.modal\('doctor',/.test(app),
    "top-bar Doctor modal title must not be the hardcoded lowercase 'doctor'");

  // The localized strings must exist in every locale so the modal title
  // never falls back to the English fallback string mid-flow.
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const row = dict.match(/'top\.doctor':\s*\{([^}]*)\}/);
  assert.ok(row, "i18n-dict.js missing 'top.doctor' entry");
  for (const lang of ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    // i18n-dict uses bare keys for short locales (en, es, ko, ja, ru)
    // and quoted keys for hyphenated locales (pt-BR, zh-CN, zh-TW).
    const keyPat = /-/.test(lang) ? `['"]${lang}['"]` : `(?:['"]${lang}['"]|${lang})`;
    assert.ok(new RegExp(`${keyPat}\\s*:\\s*['"][^'"]+['"]`).test(row[1]),
      `'top.doctor' must have a non-empty ${lang} value`);
  }

  // And the visible top-bar button declares the same key.
  const html = read('public', 'index.html');
  assert.match(html, /id="btn-doctor"[^>]*data-i18n="top\.doctor"/);
});

test('BUG-001: followup lastContact has an ISO-date pattern; validate() enforces spec.pattern', () => {
  const mp = read('public', 'js', 'views', 'mode-page.js');
  const field = mp.match(/name: 'lastContact'[\s\S]{0,800}?patternMsgFallback/);
  assert.ok(field, 'lastContact field missing pattern wiring');
  assert.ok(field[0].includes("patternMsgKey: 'followup.lastErr'"), 'lastContact missing patternMsgKey');
  // the source string literal is `'^\\d{4}-\\d{2}-\\d{2}$'` → two
  // backslash bytes per group; match them literally.
  assert.ok(field[0].includes('\\\\d{4}-\\\\d{2}-\\\\d{2}'), 'lastContact missing ISO-date pattern');
  assert.ok(mp.includes('spec.pattern && val && !new RegExp(spec.pattern).test(val)'),
    'validate() does not enforce spec.pattern');
});

test('BUG-004: router aliases #/outreach → contacto', () => {
  const r = read('public', 'js', 'router.js');
  assert.match(r, /outreach: 'contacto'/);
});

test('BUG-005: pipeline add surfaces server `deduped` as an info toast', () => {
  const p = read('public', 'js', 'views', 'pipeline.js');
  assert.match(p, /r\.deduped\) UI\.toast\(t\('pipe\.dup'/);
});

test('BUG-006: server returns a humanized, sentence-cased invalid-URL message', () => {
  const route = read('server', 'lib', 'routes', 'pipeline.mjs');
  assert.match(route, /That doesn't look like a valid job posting URL/);
  assert.ok(!/error: 'invalid url \(must be http/.test(route), 'old terse message must be gone');
});

test('BUG-010: reports empty state renders a page-subtitle', () => {
  const rep = read('public', 'js', 'views', 'reports.js');
  const empty = rep.match(/reports\.length === 0[\s\S]{0,600}?rep\.empty/);
  assert.ok(empty, 'empty-state block not found');
  assert.ok(empty[0].includes("rep.subtitle") && empty[0].includes('page-subtitle'),
    'empty state still missing the page-subtitle');
});

test('i18n: new QA keys cover all 8 locales', () => {
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const locales = ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW'];
  for (const key of ['followup.lastErr', 'pipe.dup', 'rep.subtitle']) {
    const line = dict.split('\n').find((l) => l.includes(`'${key}'`));
    assert.ok(line, `i18n key ${key} missing`);
    for (const loc of locales) {
      const tok = /-/.test(loc) ? `'${loc}':` : `${loc}:`;
      assert.ok(line.includes(tok), `${key} missing locale ${loc}`);
    }
  }
});

test('I18N-012/013: Deep research is localized in Russian (no leftover English)', () => {
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const title = dict.split('\n').find((l) => l.includes("'deep.title'"));
  assert.ok(!/ru: 'Deep research'/.test(title), 'deep.title ru still English');
  const sub = dict.split('\n').find((l) => l.includes("'deep.subtitle'"));
  assert.ok(!/smart questions/.test(sub.split("ru: '")[1].split("'")[0]),
    'deep.subtitle ru still contains untranslated "smart questions"');
});

test('BUG-002/UX-032: store.mjs allow-list flags fixtures + is exact-anchored (no false positives)', () => {
  // Static guard — robust + CI-isolated. checkProfileCustomized()
  // reads PATHS.profile (resolved once per process), so a multi-root
  // behavioural test can't run inside the shared `npm test` process;
  // assert the allow-list contract directly instead.
  const src = read('server', 'lib', 'store.mjs');
  for (const name of ['Acceptance Test', 'Real Person', 'QA', 'Sample User', 'Placeholder', 'Example User', 'Test User?']) {
    assert.ok(src.includes(name), `allow-list must flag "${name}"`);
  }
  assert.match(src, /still on template \/ test fixture/);

  // Pull the exact regex literal and prove it is ^…$-anchored +
  // case-insensitive, so a real name merely *containing* a fixture
  // word (e.g. "María Testanova") can never be false-flagged.
  const m = src.match(/if \(\/\^\((.+?)\)\$\/i\.test\(name\)\)/);
  assert.ok(m, 'allow-list must be a single ^(…)$/i anchored regex');
  const re = new RegExp('^(' + m[1] + ')$', 'i');
  assert.equal(re.test('Acceptance Test'), true);
  assert.equal(re.test('Real Person'), true);
  assert.equal(re.test('María Testanova'), false, 'real name containing "test" must NOT match');
  assert.equal(re.test('Testy McTestface'), false, 'substring "Test" must NOT match the anchored list');
});

// ── v1.58.3 — FIX-C2: <html lang> contract (the QA "stuck on en" was
// a stale-localStorage/pre-redeploy artifact; the code is correct —
// lock it so it can't regress). i18n.js is browser-only → static.
test('FIX-C2: i18n.js sets document.documentElement.lang on setLang AND at boot, detects navigator.language', () => {
  const src = read('public', 'js', 'lib', 'i18n.js');
  // setLang writes the attribute
  assert.match(src, /function setLang\(code\)\s*\{[\s\S]*document\.documentElement\.lang\s*=\s*code/,
    'setLang must set <html lang>');
  // boot sets it from the resolved current locale
  assert.match(src, /document\.documentElement\.lang\s*=\s*current/,
    'boot must set <html lang> from the resolved locale');
  // first-load detection from the browser
  assert.match(src, /navigator\.language/, 'must detect from navigator.language');
  // persisted choice
  assert.match(src, /STORAGE_KEY\s*=\s*'career-ops-ui:lang'/, 'locale persisted to localStorage');
});
