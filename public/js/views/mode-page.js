/* global Router, API, UI, I18n */
/**
 * Generic factory for the seven modes that share the same UX shape:
 *   form fields → POST /api/mode/:slug → Markdown output with Copy /
 *   Download / Open-in-tab. Pattern follows /#/deep but driven by config.
 *
 * Each mode declares:
 *   slug      — matches modes/{slug}.md and the URL hash
 *   titleKey  — i18n key for the page title
 *   subtitle  — i18n key for the subtitle
 *   fields    — array of { name, type, i18n: { label, placeholder }, required? }
 *
 * Adding a new mode is one config entry + one i18n block, no per-mode
 * view file required.
 */
(function () {
  const MODES = [
    {
      slug: 'project',
      titleKey: 'project.title',
      subtitleKey: 'project.subtitle',
      fields: [
        { name: 'idea',        type: 'textarea', i18n: { label: 'project.ideaLbl', placeholder: 'project.ideaPh' }, required: true, rows: 6 },
        { name: 'targetRole',  type: 'input',    i18n: { label: 'project.roleLbl', placeholder: 'project.rolePh' } },
      ],
    },
    {
      slug: 'training',
      titleKey: 'training.title',
      subtitleKey: 'training.subtitle',
      fields: [
        { name: 'course',  type: 'input',    i18n: { label: 'training.courseLbl', placeholder: 'training.coursePh' }, required: true },
        { name: 'goals',   type: 'textarea', i18n: { label: 'training.goalsLbl', placeholder: 'training.goalsPh' }, rows: 4 },
      ],
    },
    {
      slug: 'followup',
      titleKey: 'followup.title',
      subtitleKey: 'followup.subtitle',
      fields: [
        { name: 'company', type: 'input',    i18n: { label: 'followup.companyLbl', placeholder: 'followup.companyPh' }, required: true },
        { name: 'role',    type: 'input',    i18n: { label: 'followup.roleLbl', placeholder: 'followup.rolePh' }, required: true },
        { name: 'lastContact', type: 'input', i18n: { label: 'followup.lastLbl', placeholder: 'followup.lastPh' } },
        { name: 'notes',   type: 'textarea', i18n: { label: 'followup.notesLbl', placeholder: 'followup.notesPh' }, rows: 4 },
      ],
    },
    {
      slug: 'batch',
      titleKey: 'batch.title',
      subtitleKey: 'batch.subtitle',
      fields: [
        { name: 'urls',    type: 'textarea', i18n: { label: 'batch.urlsLbl', placeholder: 'batch.urlsPh' }, required: true, rows: 8 },
        { name: 'workers', type: 'input',    i18n: { label: 'batch.workersLbl', placeholder: 'batch.workersPh' } },
      ],
    },
    {
      slug: 'contacto',
      titleKey: 'contacto.title',
      subtitleKey: 'contacto.subtitle',
      fields: [
        { name: 'recipient', type: 'input',    i18n: { label: 'contacto.recipientLbl', placeholder: 'contacto.recipientPh' }, required: true },
        { name: 'company',   type: 'input',    i18n: { label: 'contacto.companyLbl', placeholder: 'contacto.companyPh' }, required: true },
        { name: 'role',      type: 'input',    i18n: { label: 'contacto.roleLbl', placeholder: 'contacto.rolePh' } },
        { name: 'context',   type: 'textarea', i18n: { label: 'contacto.contextLbl', placeholder: 'contacto.contextPh' }, rows: 5 },
      ],
    },
    {
      slug: 'interview-prep',
      titleKey: 'interviewPrep.title',
      subtitleKey: 'interviewPrep.subtitle',
      fields: [
        { name: 'company', type: 'input',    i18n: { label: 'interviewPrep.companyLbl', placeholder: 'interviewPrep.companyPh' }, required: true },
        { name: 'role',    type: 'input',    i18n: { label: 'interviewPrep.roleLbl', placeholder: 'interviewPrep.rolePh' }, required: true },
        { name: 'stage',   type: 'input',    i18n: { label: 'interviewPrep.stageLbl', placeholder: 'interviewPrep.stagePh' } },
      ],
    },
    {
      slug: 'patterns',
      titleKey: 'patterns.title',
      subtitleKey: 'patterns.subtitle',
      fields: [
        { name: 'window', type: 'input',    i18n: { label: 'patterns.windowLbl', placeholder: 'patterns.windowPh' } },
        { name: 'focus',  type: 'textarea', i18n: { label: 'patterns.focusLbl', placeholder: 'patterns.focusPh' }, rows: 4 },
      ],
    },
  ];

  for (const cfg of MODES) {
    Router.register(cfg.slug, () => buildModeView(cfg));
  }

  function buildModeView(cfg) {
    const c = UI.el;
    const t = (k, f) => I18n.t(k, f);
    const fields = {};
    let liveAvailable = false;
    let liveEngine = '';

    // Probe Anthropic OR Gemini availability without blocking initial render.
    // When a key is available, we flip "▶ Run" to be the PRIMARY button
    // (executes via API, returns Markdown to the browser) and demote the
    // prompt-only flow to a ghost button. The user's expectation on
    // /#/contacto, /#/interview-prep, /#/project, etc. is "do the thing",
    // not "give me a prompt to paste somewhere else".
    API.get('/api/health').then((h) => {
      const anth = h.checks?.find((x) => x.name === 'ANTHROPIC_API_KEY')?.ok === true;
      const gem = h.checks?.find((x) => x.name === 'GEMINI_API_KEY')?.ok === true;
      if (anth) { liveAvailable = true; liveEngine = 'Anthropic'; }
      else if (gem) { liveAvailable = true; liveEngine = 'Gemini'; }
      if (liveAvailable) {
        // Promote runLive → primary, demote manualBtn → ghost.
        runLiveBtn.style.display = '';
        runLiveBtn.classList.remove('btn-ghost');
        runLiveBtn.classList.add('btn-primary');
        // Engine name (Anthropic / Gemini) is intentionally hidden — the
        // user just wants "run it", not to think about which provider
        // is wired up. The current engine still surfaces on /#/health
        // for power users.
        runLiveBtn.textContent = '⚡ ' + t('mode.runLive', 'Run live');
        runLiveBtn.title = liveEngine; // hover tooltip keeps the info accessible
        manualBtn.classList.remove('btn-primary');
        manualBtn.classList.add('btn-ghost');
        manualBtn.textContent = t('mode.runManual', 'Generate prompt');
        // Re-order so Run live appears first in the row.
        if (runLiveBtn.parentNode) runLiveBtn.parentNode.insertBefore(runLiveBtn, manualBtn);
      }
    }).catch(() => {});

    function field(spec) {
      const opts = {
        className: spec.type === 'textarea' ? 'textarea' : 'input',
        placeholder: t(spec.i18n.placeholder, spec.i18n.placeholder),
      };
      if (spec.type === 'textarea') opts.rows = spec.rows || 4;
      const el = c(spec.type, opts);
      fields[spec.name] = el;
      return c('div', { className: 'field' }, [
        c('label', null, t(spec.i18n.label, spec.i18n.label)),
        el,
      ]);
    }

    const out = c('div');

    function payload() {
      const body = {};
      for (const spec of cfg.fields) body[spec.name] = (fields[spec.name].value || '').trim();
      return body;
    }

    function validate() {
      for (const spec of cfg.fields) {
        if (spec.required && !fields[spec.name].value.trim()) {
          UI.toast(t('mode.required', 'Please fill the required fields'), 'error');
          fields[spec.name].focus();
          return false;
        }
      }
      return true;
    }

    function showResult(title, markdown, slug) {
      out.innerHTML = '';
      const card = c('div', { className: 'card' });
      const actions = [
        c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            navigator.clipboard.writeText(markdown);
            UI.toast(t('eval.copied', 'Copied'), 'success');
          },
        }, '📋 ' + t('eval.copy', 'Copy')),
        c('button', {
          className: 'btn btn-ghost btn-sm',
          onClick: () => {
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${slug}-${Date.now()}.md`;
            a.click();
            URL.revokeObjectURL(a.href);
          },
        }, '⬇ ' + t('mode.download', 'Download .md')),
      ];
      // G-002: surface Generate PDF on interview-prep results so the user
      // can ship the same brief through Playwright as #/deep does.
      if (slug === 'interview-prep' && window.PdfGenerate) {
        actions.push(c('button', {
          className: 'btn btn-primary btn-sm',
          onClick: (e) => {
            window.PdfGenerate.run({
              kind: 'inline', markdown, title, slug: 'interview-prep', button: e.currentTarget,
            });
          },
        }, '📄 ' + t('common.generatePdf', 'Generate PDF')));
      }
      const header = c('div', { className: 'flex-between mb-3' }, [
        c('strong', null, title),
        c('div', { className: 'flex gap-3' }, actions),
      ]);
      const body = c('div', { className: 'card md', html: UI.md(markdown || '') });
      card.append(header, body);
      out.appendChild(card);
    }

    function showPrompt(prompt, message, slug) {
      out.innerHTML = '';
      out.appendChild(c('div', { className: 'card' }, [
        c('p', { style: { color: 'var(--foggy)' } }, message || ''),
        c('pre', { className: 'console', style: { maxHeight: '60vh', overflow: 'auto' } }, prompt),
        c('div', { className: 'flex gap-3 mt-3' }, [
          c('button', {
            className: 'btn btn-primary',
            onClick: () => {
              navigator.clipboard.writeText(prompt);
              UI.toast(t('eval.copied', 'Copied'), 'success');
            },
          }, '📋 ' + t('eval.copy', 'Copy prompt')),
          // Re-submits with run:true so the user can hit it after
          // "Generate prompt" without retyping. Errors out cleanly
          // when no API key is wired up.
          c('button', {
            className: 'btn btn-ghost',
            onClick: async (e) => {
              if (!liveAvailable) {
                UI.toast(t('deep.needKey', 'Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first'), 'error');
                return;
              }
              await submit(e.currentTarget, true);
            },
          }, '⚡ ' + t('deep.showResult', 'Show result')),
        ]),
      ]));
    }

    async function submit(btn, run) {
      if (!validate()) return;
      out.innerHTML = `<div class="loading">${t('mode.generating', 'Generating…')}</div>`;
      try {
        const r = await UI.withSpinner(btn, () => API.post('/api/mode/' + cfg.slug, { ...payload(), run }));
        const titleStr = `${t(cfg.titleKey)} — ${new Date().toLocaleString()}`;
        if (r.markdown) {
          showResult(titleStr, r.markdown, cfg.slug);
        } else {
          showPrompt(r.prompt, r.message, cfg.slug);
        }
      } catch (e) {
        out.innerHTML = '';
        out.appendChild(c('div', { className: 'empty' }, e.message || String(e)));
      }
    }

    const manualBtn = c('button', {
      className: 'btn btn-primary',
      onClick: (e) => submit(e.currentTarget, false),
    }, '▶ ' + t('mode.runManual', 'Generate prompt'));

    const runLiveBtn = c('button', {
      className: 'btn btn-ghost',
      style: { display: 'none' },
      onClick: (e) => submit(e.currentTarget, true),
    }, '⚡ ' + t('mode.runLive', 'Run live'));

    return c('div', null, [
      c('header', { className: 'page-header' }, [
        c('div', null, [
          c('h1', { className: 'page-title' }, t(cfg.titleKey)),
          c('p', { className: 'page-subtitle' }, t(cfg.subtitleKey)),
        ]),
      ]),
      c('div', { className: 'card' }, [
        ...cfg.fields.map(field),
        c('div', { className: 'flex gap-3' }, [manualBtn, runLiveBtn]),
      ]),
      c('div', { className: 'mt-5' }, out),
    ]);
  }
})();
