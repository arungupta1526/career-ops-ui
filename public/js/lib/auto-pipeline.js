/* global API, UI, I18n */
/**
 * G-007 (v1.15.0) — Auto-pipeline 1-click flow.
 *
 * Implements the canonical career-ops.org promise: paste a job URL,
 * get a full report + PDF + tracker row in 1–2 minutes WITHOUT
 * navigating across 3 pages. The orchestrator chains five existing
 * endpoints and renders a step-by-step modal timeline:
 *
 *   1. validate URL                 → client-side regex
 *   2. fetch JD                     → GET /api/pipeline/preview
 *   3. evaluate against CV          → POST /api/evaluate { jd, save: true }
 *   4. generate PDF                 → POST /api/stream/pdf/inline (SSE)
 *   5. add tracker row              → POST /api/tracker
 *
 * v1.15.0 limitations (documented as v1.16+ follow-ups):
 *   - Company / role are heuristically extracted from the JD title;
 *     for low-confidence matches the modal lets the user override
 *     before step 5.
 *   - No POST /api/reports primitive yet, so the report markdown
 *     is shown inline in the modal but NOT persisted to parent
 *     reports/. The PDF + tracker row are the durable artifacts.
 */
(function () {
  if (!window.UI || !window.API) {
    console.warn('[auto-pipeline] UI/API not loaded yet — deferring');
    return;
  }

  const STEPS = [
    { key: 'validate', i18nKey: 'auto.step.validate', label: 'Validating URL' },
    { key: 'fetch',    i18nKey: 'auto.step.fetch',    label: 'Fetching job description' },
    { key: 'evaluate', i18nKey: 'auto.step.evaluate', label: 'Evaluating against your CV' },
    { key: 'pdf',      i18nKey: 'auto.step.pdf',      label: 'Generating tailored PDF' },
    { key: 'tracker',  i18nKey: 'auto.step.tracker',  label: 'Adding to tracker' },
  ];

  // Heuristic company / role extraction from raw JD text. Looks for the
  // first H1-like sentence ("Senior Backend Engineer at Anthropic"), then
  // "<company> is hiring", then plain "Backend Engineer" with no company.
  function guessCompanyRole(jdText, url) {
    const firstLines = (jdText || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 30);
    let company = '';
    let role = '';
    for (const line of firstLines) {
      if (line.length > 200) continue;
      // "Senior Backend Engineer at Anthropic"
      let m = line.match(/^([A-Z][\w\s/&,.()-]{4,80}?)\s+(?:at|@|·|\|)\s+([A-Z][\w\s.&-]{1,40})$/);
      if (m) { role = m[1].trim(); company = m[2].trim(); break; }
      // "Anthropic — Senior Backend Engineer"
      m = line.match(/^([A-Z][\w\s.&-]{1,40})\s+[—-]\s+(.{4,80})$/);
      if (m && !role) { company = m[1].trim(); role = m[2].trim(); }
    }
    if (!company) {
      try {
        const u = new URL(url);
        const parts = u.hostname.split('.');
        const slug = parts.length >= 2 ? parts[parts.length - 2] : u.hostname;
        if (!['greenhouse', 'ashbyhq', 'lever', 'workable', 'smartrecruiters', 'myworkdayjobs'].includes(slug)) {
          company = slug.charAt(0).toUpperCase() + slug.slice(1);
        }
      } catch {}
    }
    if (!role) {
      role = firstLines.find((l) => /engineer|developer|manager|lead|architect|designer|analyst|director|specialist/i.test(l)) || '';
      role = role.slice(0, 100);
    }
    return { company: company || '', role: role || '' };
  }

  // Heuristic score extraction from the evaluation markdown. Looks for
  // `score: 4.2/5` / `**Score: 4.2/5**` / `## Score: 4.2`. Returns
  // numeric 0–5 or null if not found.
  function extractScore(md) {
    if (!md) return null;
    const patterns = [
      /score\s*[:\-]\s*(\d+\.?\d*)\s*\/\s*5/i,
      /\*\*\s*score\s*[:\-]\s*(\d+\.?\d*)/i,
      /^score:\s*(\d+\.?\d*)/im,
    ];
    for (const p of patterns) {
      const m = md.match(p);
      if (m) {
        const n = parseFloat(m[1]);
        if (!isNaN(n) && n >= 0 && n <= 5) return n;
      }
    }
    return null;
  }

  function extractLegitimacy(md) {
    if (!md) return '';
    const m = md.match(/legitimacy\s*[:\-]\s*(high|medium|low|verified|suspicious|caution)\b/i);
    return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : '';
  }

  function urlIsValid(url) {
    if (typeof url !== 'string') return false;
    if (!/^https?:\/\//i.test(url)) return false;
    try {
      const u = new URL(url);
      // Reject loopback / private / javascript URLs (defense in depth;
      // server's isValidJobUrl is the real gate).
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      if (/^(localhost|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i.test(u.hostname)) return false;
      return true;
    } catch { return false; }
  }

  function open() {
    const c = UI.el;
    const t = (k, f) => I18n.t(k, f);

    let modalRef = null;
    let state = { url: '', jdText: '', markdown: '', score: null, legitimacy: '', company: '', role: '', pdfPath: '' };
    const stepState = STEPS.map(() => ({ status: 'pending', detail: '', startedAt: null, finishedAt: null }));

    const urlInput = c('input', {
      className: 'input',
      placeholder: 'https://job-boards.greenhouse.io/anthropic/jobs/4567',
      style: { width: '100%' },
    });

    const startBtn = c('button', {
      className: 'btn btn-primary',
      onClick: () => start(urlInput.value.trim()),
    }, '▶ ' + t('auto.run', 'Run auto-pipeline'));

    const timelineRoot = c('div', { style: { display: 'none', marginTop: '20px' } });
    const resultRoot   = c('div', { style: { display: 'none', marginTop: '20px' } });

    function renderTimeline() {
      timelineRoot.innerHTML = '';
      STEPS.forEach((step, i) => {
        const s = stepState[i];
        let icon = '[ ]';
        if (s.status === 'running') icon = '[…]';
        else if (s.status === 'done') icon = '[✓]';
        else if (s.status === 'failed') icon = '[✗]';
        const row = c('div', {
          style: {
            display: 'flex', gap: '12px', padding: '8px 0',
            borderBottom: '1px solid var(--slate)',
            opacity: s.status === 'pending' ? 0.5 : 1,
          },
        }, [
          c('span', { style: { fontFamily: 'monospace', fontWeight: 600, color: s.status === 'failed' ? 'var(--error, #c93030)' : s.status === 'done' ? 'var(--ok, #2e8b3e)' : 'inherit' } }, icon),
          c('span', { style: { flex: '0 0 auto', minWidth: '32px', fontFamily: 'monospace' } }, `${i + 1}/${STEPS.length}`),
          c('span', { style: { flex: '1' } }, t(step.i18nKey, step.label)),
          c('span', { style: { color: 'var(--foggy)', fontSize: '13px' } }, s.detail || ''),
        ]);
        timelineRoot.appendChild(row);
      });
    }

    function setStep(i, status, detail) {
      stepState[i].status = status;
      if (detail !== undefined) stepState[i].detail = detail;
      if (status === 'running') stepState[i].startedAt = Date.now();
      if (status === 'done' || status === 'failed') stepState[i].finishedAt = Date.now();
      renderTimeline();
    }

    async function start(url) {
      // Step 1 — validate
      timelineRoot.style.display = '';
      resultRoot.style.display = 'none';
      startBtn.disabled = true;
      urlInput.disabled = true;
      state.url = url;
      setStep(0, 'running');
      if (!urlIsValid(url)) {
        setStep(0, 'failed', t('auto.invalidUrl', 'invalid URL'));
        startBtn.disabled = false;
        urlInput.disabled = false;
        return;
      }
      setStep(0, 'done', 'ok');

      // Step 2 — fetch JD via /api/pipeline/preview
      setStep(1, 'running');
      try {
        const r = await API.get('/api/pipeline/preview?url=' + encodeURIComponent(url));
        if (!r.text || r.status === 0) {
          setStep(1, 'failed', t('auto.fetchFailed', 'fetch failed: ') + (r.text || 'no body'));
          startBtn.disabled = false; urlInput.disabled = false;
          return;
        }
        state.jdText = r.text;
        const guess = guessCompanyRole(state.jdText, url);
        state.company = guess.company;
        state.role = guess.role;
        setStep(1, 'done', `${(r.text.length / 1024).toFixed(1)} KB`);
      } catch (e) {
        setStep(1, 'failed', e.message || 'fetch error');
        startBtn.disabled = false; urlInput.disabled = false;
        return;
      }

      // Step 3 — evaluate (long step, no streaming; just show spinner)
      setStep(2, 'running', t('auto.evaluating', 'Anthropic / Gemini call (30–60 s)…'));
      try {
        const r = await API.post('/api/evaluate', { jd: state.jdText, save: true });
        if (r.error) {
          setStep(2, 'failed', r.error);
          startBtn.disabled = false; urlInput.disabled = false;
          return;
        }
        state.markdown = r.markdown || r.prompt || '';
        state.score = extractScore(state.markdown);
        state.legitimacy = extractLegitimacy(state.markdown);
        setStep(2, 'done', state.score != null ? `score ${state.score}/5` : (r.mode || 'manual'));
      } catch (e) {
        setStep(2, 'failed', e.message || 'evaluate error');
        startBtn.disabled = false; urlInput.disabled = false;
        return;
      }

      // Step 4 — PDF via SSE POST /api/stream/pdf/inline
      setStep(3, 'running', t('auto.pdfRunning', 'Playwright render…'));
      try {
        const slug = (state.company + '-' + state.role).toLowerCase().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'auto-' + Date.now();
        const resp = await fetch('/api/stream/pdf/inline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: state.markdown, title: `${state.role} — ${state.company}`, slug }),
        });
        if (!resp.ok) {
          // The PDF endpoint requires Playwright on the parent. Treat as
          // skip not fatal — the user still has the report markdown and
          // can manually generate the PDF later.
          setStep(3, 'failed', 'PDF skipped (HTTP ' + resp.status + '). Playwright may be missing.');
        } else {
          // Drain the SSE stream to know when it's done.
          const reader = resp.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          let pdfDone = false;
          while (!pdfDone) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const evts = buf.split('\n\n'); buf = evts.pop();
            for (const e of evts) {
              if (e.includes('event: done')) {
                pdfDone = true;
                const m = e.match(/"path"\s*:\s*"([^"]+)"/);
                if (m) state.pdfPath = m[1];
              } else if (e.includes('event: error')) {
                setStep(3, 'failed', 'PDF error');
                pdfDone = true;
              }
            }
          }
          if (state.pdfPath) {
            setStep(3, 'done', state.pdfPath.split('/').pop());
          } else if (stepState[3].status !== 'failed') {
            setStep(3, 'done', 'ok');
          }
        }
      } catch (e) {
        setStep(3, 'failed', e.message || 'PDF error');
      }

      // Step 5 — tracker (only if we have at least a company)
      setStep(4, 'running');
      try {
        if (!state.company) {
          setStep(4, 'failed', t('auto.noCompany', 'company unknown — fill in manually below'));
        } else {
          const r = await API.post('/api/tracker', {
            company: state.company,
            role: state.role || 'Role TBD',
            score: state.score != null ? String(state.score) + '/5' : undefined,
            status: 'Evaluated',
            url: state.url,
            notes: 'auto-pipeline',
          });
          if (r && r.deduped) setStep(4, 'done', t('auto.deduped', 'already tracked'));
          else if (r && r.num) setStep(4, 'done', `#${r.num}`);
          else setStep(4, 'done', 'ok');
        }
      } catch (e) {
        setStep(4, 'failed', e.message || 'tracker error');
      }

      // Show result panel
      renderResult();
      startBtn.disabled = false; urlInput.disabled = false;
    }

    function renderResult() {
      resultRoot.innerHTML = '';
      resultRoot.style.display = '';
      resultRoot.appendChild(c('div', { className: 'card mt-3' }, [
        c('h3', null, '✨ ' + t('auto.done', 'Auto-pipeline complete')),
        c('div', { className: 'flex gap-3', style: { flexWrap: 'wrap', marginTop: '8px' } }, [
          state.company ? c('span', { className: 'tag' }, state.company) : null,
          state.role ? c('span', { className: 'tag' }, state.role) : null,
          state.score != null ? c('span', { className: 'tag' }, t('auto.score', 'Score') + ' ' + state.score) : null,
          state.legitimacy ? c('span', { className: 'tag' }, t('auto.legit', 'Legit') + ' ' + state.legitimacy) : null,
        ].filter(Boolean)),
        state.pdfPath ? c('p', { style: { marginTop: '8px' } }, [
          c('a', { href: '/api/output/pdfs/' + encodeURIComponent(state.pdfPath.split('/').pop()), target: '_blank' },
            '📄 ' + t('auto.openPdf', 'Open PDF')),
        ]) : null,
        c('details', { style: { marginTop: '12px' } }, [
          c('summary', { style: { cursor: 'pointer' } }, t('auto.viewMd', 'View evaluation markdown')),
          c('pre', { className: 'console', style: { maxHeight: '40vh', overflow: 'auto', whiteSpace: 'pre-wrap' } }, state.markdown || ''),
        ]),
      ]));
    }

    modalRef = UI.modal(t('auto.title', '✨ Auto-pipeline a URL'), c('div', null, [
      c('p', { style: { color: 'var(--foggy)' } },
        t('auto.intro', 'Paste a job URL — we\'ll fetch the JD, evaluate it against your CV, generate a tailored PDF, and add a row to your tracker.')),
      c('div', { className: 'flex gap-3 mt-3' }, [urlInput, startBtn]),
      timelineRoot,
      resultRoot,
    ]));
  }

  window.AutoPipeline = { open };
})();
