/* global UI, I18n */
/**
 * v1.54.3 (USER-REQ) — structured field-form for the #/config "Modes"
 * tab. Until v1.54.2 the tab showed ONE raw <textarea> per `##`
 * section (v1.36.0 section-level granularity). The user asked for real
 * fields derived from the documented schema, not raw markdown:
 *   "собери данные по полям, разбей из документации, определи набор
 *    полей и реализуй поля именно, а не сырой".
 *
 * `modes/_profile.md` is the canonical "Career framing" file
 * (career-ops.org Quick Start §Step-5). Its documented schema:
 *
 *   ## Target Roles      → bullet list  (one role per line)
 *   ## Adaptive Framing  → bullet list  (one framing angle per line)
 *   ## Exit Narrative    → prose        (free text)
 *   ## Comp Targets      → bullet list  (one comp line per line)
 *   ## Location Policy   → prose        (free text)
 *
 * Field rendering by section kind:
 *   - list  → repeatable add/remove labelled <input> rows
 *   - prose → one labelled <textarea>
 *
 * Data-safety invariants (never lose the user's parent file):
 *   1. A canonical LIST section whose body isn't a pure bullet list
 *      (user put prose there) falls back to a labelled <textarea> so
 *      arbitrary content survives a round-trip untouched.
 *   2. Non-canonical `##` sections render as labelled <textarea>s and
 *      are included in collect() so the merge-not-replace PUT keeps
 *      them. (The server also preserves the preamble + any section we
 *      never send — this is belt-and-braces.)
 *   3. Round-trip stable: serialise(parse(body)) re-parses to the same
 *      fields, so saving an untouched section doesn't churn it.
 *
 * Browser-only (global script, like auto-pipeline.js). The pure
 * parse/serialise/classify logic is mirrored + proven in
 * tests/modes-form.test.mjs.
 */
(function () {
  // Documented schema. Key = exact `## ` heading text. `labelKey` is an
  // i18n key (fallback = the heading itself, so an untranslated locale
  // still shows something sensible).
  const SCHEMA = {
    'Target Roles':     { kind: 'list',  labelKey: 'config.modesTargetRoles' },
    'Adaptive Framing': { kind: 'list',  labelKey: 'config.modesAdaptiveFraming' },
    'Exit Narrative':   { kind: 'prose', labelKey: 'config.modesExitNarrative' },
    'Comp Targets':     { kind: 'list',  labelKey: 'config.modesCompTargets' },
    'Location Policy':  { kind: 'prose', labelKey: 'config.modesLocationPolicy' },
  };

  const BULLET_RE = /^[ \t]*[-*+][ \t]+(.*)$/;

  // A body is a "pure list" iff every non-blank line is a bullet line.
  // Empty bodies count as a pure (empty) list.
  function isPureList(body) {
    const lines = String(body || '').split('\n');
    let sawBullet = false;
    for (const ln of lines) {
      if (ln.trim() === '') continue;
      const m = ln.match(BULLET_RE);
      if (!m) return false;
      sawBullet = true;
    }
    return sawBullet || String(body || '').trim() === '';
  }

  // Extract bullet item texts (trimmed). Blank/placeholder bullets drop.
  function parseListItems(body) {
    return String(body || '')
      .split('\n')
      .map((ln) => {
        const m = ln.match(BULLET_RE);
        return m ? m[1].trim() : null;
      })
      .filter((v) => v && v.length);
  }

  // Items → section body. Blank line after the heading, one `- item`
  // per line, blank line before the next `## `. Empty list → a single
  // blank line (valid empty section; server merge tolerates it).
  function serialiseList(items) {
    const clean = (items || []).map((s) => String(s).trim()).filter(Boolean);
    if (!clean.length) return '\n\n';
    return '\n' + clean.map((s) => `- ${s}`).join('\n') + '\n\n';
  }

  // Prose body ↔ textarea value. Display = trimmed; on save we wrap in
  // blank lines so the markdown stays clean and stable.
  function proseDisplay(body) { return String(body || '').replace(/^\n+|\n+$/g, ''); }
  function serialiseProse(value) {
    const v = String(value || '').replace(/^\n+|\n+$/g, '');
    return v ? `\n\n${v}\n\n` : '\n\n';
  }

  function label(heading) {
    const spec = SCHEMA[heading];
    return spec ? I18n.t(spec.labelKey, heading) : heading;
  }

  /**
   * Build the field-form.
   * @param {{heading:string, body:string}[]} sections
   * @returns {{ host: HTMLElement, collect: () => Object<string,string> }}
   *   collect() → { "<heading>": "<reconstructed body>" } for EVERY
   *   rendered section (canonical + unknown) — ready for the existing
   *   PUT /api/modes/_profile { sections } merge path.
   */
  function build(sections) {
    const c = UI.el;
    const host = c('div');
    const collectors = []; // () => [heading, body]

    if (!sections || !sections.length) {
      host.appendChild(c('p', { style: { color: 'var(--foggy)', fontSize: '13px' } },
        I18n.t('config.modesNoSections', 'No ## sections found — use the raw editor below.')));
      return { host, collect: () => ({}) };
    }

    sections.forEach((s, idx) => {
      const heading = s.heading;
      const body = s.body || '';
      const spec = SCHEMA[heading];
      const fieldId = 'modesf-' + idx + '-' + heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const lbl = label(heading);

      const card = c('div', {
        className: 'card',
        style: { padding: '14px 16px', marginBottom: '12px' },
      });
      card.appendChild(c('label', {
        htmlFor: fieldId,
        style: { display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' },
      }, lbl));

      const isCanonicalList = spec && spec.kind === 'list';
      const isCanonicalProse = spec && spec.kind === 'prose';

      if (isCanonicalList && isPureList(body)) {
        // ── repeatable line-item editor ──
        const rows = c('div', { id: fieldId, style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
        const inputs = [];
        const addRow = (val) => {
          const inp = c('input', {
            type: 'text', className: 'input', value: val || '',
            'aria-label': lbl + ' — ' + I18n.t('config.modesItemAria', 'line') + ' ' + (inputs.length + 1),
            style: { flex: '1' },
          });
          const rm = c('button', {
            type: 'button', className: 'btn btn-ghost btn-sm',
            'aria-label': I18n.t('config.modesRemoveItem', 'Remove line'),
            onClick: () => {
              const i = inputs.indexOf(inp);
              if (i >= 0) inputs.splice(i, 1);
              row.remove();
            },
          }, '✕');
          const row = c('div', { className: 'flex gap-3', style: { alignItems: 'center' } }, [inp, rm]);
          inputs.push(inp);
          rows.appendChild(row);
        };
        const existing = parseListItems(body);
        if (existing.length) existing.forEach(addRow); else addRow('');
        card.appendChild(rows);
        card.appendChild(c('button', {
          type: 'button', className: 'btn btn-ghost btn-sm', style: { marginTop: '8px' },
          onClick: () => addRow(''),
        }, '＋ ' + I18n.t('config.modesAddItem', 'Add line')));
        collectors.push(() => [heading, serialiseList(inputs.map((i) => i.value))]);
      } else if (isCanonicalProse) {
        // ── single labelled prose textarea ──
        const ta = c('textarea', {
          id: fieldId, className: 'textarea', rows: 6,
          style: { width: '100%', fontSize: '13px' },
        });
        ta.value = proseDisplay(body);
        card.appendChild(ta);
        collectors.push(() => [heading, serialiseProse(ta.value)]);
      } else {
        // ── data-safety fallback: labelled raw textarea ──
        // Canonical list with non-list content, OR a non-canonical
        // section. Edit verbatim; round-trips byte-for-byte.
        const note = isCanonicalList
          ? I18n.t('config.modesNonListNote',
            'This section isn\'t a simple list — editing as raw text to avoid data loss.')
          : I18n.t('config.modesUnknownNote',
            'Custom section (not in the standard schema) — editing as raw text.');
        card.appendChild(c('p', {
          style: { color: 'var(--foggy)', fontSize: '12px', margin: '0 0 8px' },
        }, note));
        const ta = c('textarea', {
          id: fieldId, className: 'textarea', rows: 8,
          style: { width: '100%', fontFamily: 'ui-monospace,monospace', fontSize: '13px' },
        });
        ta.value = body;
        card.appendChild(ta);
        // Verbatim — no reshaping, so an untouched custom section is
        // preserved exactly through the merge PUT.
        collectors.push(() => [heading, ta.value]);
      }

      host.appendChild(card);
    });

    return {
      host,
      collect: () => {
        const out = {};
        for (const fn of collectors) {
          const [h, b] = fn();
          out[h] = b;
        }
        return out;
      },
    };
  }

  window.ModesForm = {
    build,
    // Exposed for tests / reuse.
    _schema: SCHEMA,
    _isPureList: isPureList,
    _parseListItems: parseListItems,
    _serialiseList: serialiseList,
    _proseDisplay: proseDisplay,
    _serialiseProse: serialiseProse,
  };
})();
