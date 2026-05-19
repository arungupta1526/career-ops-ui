/* global Router, API, UI, I18n */
Router.register('apply', async () => {
  const c = UI.el;
  const t = (k, f) => I18n.t(k, f);
  const url = c('input', { className: 'input', id: 'apply-url', placeholder: 'https://...' });
  const jd = c('textarea', { className: 'textarea', id: 'apply-jd', rows: 10, placeholder: t('apply.jdLbl') });
  const out = c('div');

  // M-8 (v1.58.13) — apply checklist is now interactive: the pre-fix
  // monospace block is replaced by real <input type="checkbox"> rows
  // whose state is persisted per-URL in localStorage so the user can
  // come back later and resume. Items are extracted from the plain
  // checklist text on a best-effort basis (split on newlines, trim,
  // drop blanks); a leading list marker (`-`, `*`, `1.`, `[ ]`) is
  // stripped so the label reads cleanly. Two action buttons sit below
  // the list: "Copy unchecked" (clipboard the still-open items as a
  // markdown bullet list) and "Reset" (clear all ticks for this URL).
  const STORAGE_PREFIX = 'applyChecklist:';
  function slugForUrl(u) {
    // Deterministic, short, no PII — strip protocol/query then keep
    // alphanum+`-_./:` chars. Safe as a localStorage suffix.
    return String(u || '')
      .replace(/^https?:\/\//, '')
      .replace(/\?.*$/, '')
      .replace(/[^a-zA-Z0-9._/:-]/g, '_')
      .slice(0, 240);
  }
  function parseChecklist(raw) {
    return String(raw || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      // strip a leading list marker so the label is the item text only
      .map((l) => l.replace(/^(?:[-*•]|\d+[.)]|\[\s?\])\s+/, ''))
      .filter((l) => l.length > 0);
  }
  function loadState(slug, n) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + slug);
      if (!raw) return new Array(n).fill(false);
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Array(n).fill(false);
      const out = new Array(n).fill(false);
      for (let i = 0; i < Math.min(arr.length, n); i++) out[i] = !!arr[i];
      return out;
    } catch { return new Array(n).fill(false); }
  }
  function saveState(slug, state) {
    try { localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(state)); }
    catch { /* private mode — ignore */ }
  }

  function renderChecklist(items, slug) {
    const state = loadState(slug, items.length);
    const list = c('ul', { className: 'apply-checklist', 'data-url-slug': slug });
    items.forEach((text, i) => {
      const cb = c('input', { type: 'checkbox', 'data-item-index': String(i) });
      cb.checked = state[i];
      cb.addEventListener('change', () => {
        state[i] = cb.checked;
        saveState(slug, state);
      });
      list.appendChild(c('li', null,
        c('label', null, [cb, c('span', null, text)])));
    });
    const actions = c('div', { className: 'apply-checklist__actions' }, [
      c('button', {
        type: 'button',
        className: 'btn btn-ghost btn-sm',
        onClick: async () => {
          const lines = items
            .filter((_, i) => !state[i])
            .map((s) => '- ' + s);
          const md = lines.join('\n');
          try {
            await navigator.clipboard.writeText(md);
            UI.toast(t('apply.checklist.copied', 'Unchecked items copied'), 'success');
          } catch {
            UI.toast(t('apply.checklist.copyFailed', 'Copy failed'), 'error');
          }
        },
      }, '📋 ' + t('apply.checklist.copyUnchecked', 'Copy unchecked')),
      c('button', {
        type: 'button',
        className: 'btn btn-ghost btn-sm',
        onClick: () => {
          for (let i = 0; i < state.length; i++) state[i] = false;
          saveState(slug, state);
          list.querySelectorAll('input[type=checkbox]').forEach((el) => { el.checked = false; });
          UI.toast(t('apply.checklist.reset', 'Checklist reset'), 'info');
        },
      }, '↺ ' + t('apply.checklist.resetBtn', 'Reset')),
    ]);
    return c('div', null, [list, actions]);
  }

  async function run() {
    if (!url.value.trim()) return UI.toast(t('apply.enterUrl'), 'error');
    out.innerHTML = `<div class="loading">…</div>`;
    try {
      const r = await API.post('/api/apply-helper', { url: url.value.trim(), jd: jd.value.trim() });
      const items = parseChecklist(r.checklist);
      const slug = slugForUrl(url.value.trim());
      out.innerHTML = '';
      const card = c('div', { className: 'card' }, [c('p', null, r.message)]);
      if (items.length) {
        card.appendChild(renderChecklist(items, slug));
      } else {
        // Defensive fallback: if the parser found nothing, show the raw
        // text so the user isn't presented with an empty card.
        card.appendChild(c('pre', { className: 'console' }, r.checklist || ''));
      }
      out.appendChild(card);
    } catch (e) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'empty' }, (e && e.message) || 'apply failed'));
    }
  }

  return c('div', null, [
    c('header', { className: 'page-header' }, [
      c('div', null, [
        c('h1', { className: 'page-title' }, t('apply.title')),
        c('p', { className: 'page-subtitle' }, t('apply.subtitle')),
      ]),
    ]),
    c('div', {
      className: 'card mb-3',
      style: { background: '#eef5ff', borderColor: '#9bb6e0', color: '#1f3b6e' },
    }, [
      c('strong', null, 'ℹ ' + t('apply.bannerTitle', 'Checklist only')),
      c('p', { style: { margin: '6px 0 0', fontSize: '14px' } },
        t('apply.bannerBody', 'This page generates a checklist + paste-ready text. Real Playwright form-fill (with a final-confirm) lives in Claude Code: /career-ops apply <url>')),
      c('p', { style: { margin: '6px 0 0', fontSize: '13px' } }, [
        // PR-9: surface the canonical Playwright setup guide so users
        // who hit a "browser not installed" error in the CLI have an
        // exact, vendor-blessed install path.
        t('apply.playwrightHint', 'Need Playwright? See '),
        c('a', {
          href: 'https://career-ops.org/docs/introduction/guides/set-up-playwright',
          target: '_blank', rel: 'noopener noreferrer',
        }, 'career-ops.org/docs/.../set-up-playwright'),
        ' · ',
        c('a', {
          href: 'https://career-ops.org/docs/introduction/guides/apply-for-a-job',
          target: '_blank', rel: 'noopener noreferrer',
        }, t('apply.docsLink', 'Apply guide')),
      ]),
    ]),
    c('div', { className: 'card' }, [
      c('div', { className: 'field' }, [c('label', { htmlFor: 'apply-url' }, t('apply.urlLbl')), url]),
      c('div', { className: 'field' }, [c('label', { htmlFor: 'apply-jd' }, t('apply.jdLbl')), jd]),
      c('button', { className: 'btn btn-primary', onClick: run }, t('apply.run')),
    ]),
    c('div', { className: 'mt-5' }, out),
  ]);
});
