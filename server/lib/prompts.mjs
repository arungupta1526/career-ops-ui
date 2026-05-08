/**
 * Prompt builders for LLM-bound payloads.
 *
 * Centralizes every string the server can hand to Anthropic / Gemini.
 * Helpers in here are PURE — no I/O — except `bundleProjectContext`,
 * which reads parent-project files synchronously when called.
 *
 * Used by routes /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper.
 */
import { existsSync, readFileSync } from 'node:fs';
import { PATHS, path as projPath } from './paths.mjs';
import { slugify } from './parsers.mjs';

/**
 * Bundle parent-project files into a single `<project_context>` block
 * for Anthropic SDK calls (which have no filesystem). Each file is read
 * defensively (missing → skipped, oversized → truncated) and labeled
 * with its origin path so the model can cite it back.
 *
 * Used by /api/deep and /api/mode/:slug Anthropic branches (REVIEW-A1).
 *
 * @param {{ modeSlugs?: string[], maxBytesPerFile?: number }} opts
 * @returns {string} A delimited block ending with two newlines, ready to
 *   prepend to the user-facing prompt.
 */
export function bundleProjectContext(opts = {}) {
  const maxBytes = opts.maxBytesPerFile ?? 16 * 1024;
  const modeSlugs = opts.modeSlugs ?? [];
  const files = [
    { label: 'cv.md', path: PATHS.cv },
    { label: 'config/profile.yml', path: PATHS.profile },
    ...modeSlugs.map((slug) => ({
      label: `modes/${slug}.md`,
      path: projPath('modes', `${slug}.md`),
    })),
  ];
  const blocks = [];
  for (const f of files) {
    if (!existsSync(f.path)) continue;
    let text;
    try { text = readFileSync(f.path, 'utf8'); } catch { continue; }
    if (text.length > maxBytes) {
      text = text.slice(0, maxBytes) + `\n\n[…truncated at ${maxBytes} bytes…]`;
    }
    blocks.push(`--- ${f.label} ---\n${text}`);
  }
  if (!blocks.length) return '';
  return [
    '<project_context>',
    'You are running outside Claude Code, so the files referenced below',
    'are inlined here. Treat them as authoritative.',
    '',
    blocks.join('\n\n'),
    '</project_context>',
    '',
    '',
  ].join('\n');
}

/**
 * Glue the user-supplied context onto a parent-project mode template.
 * The mode file is the canonical prompt; we just decorate it with the
 * fields the user filled in. Strips any { run: ... } toggle so it
 * doesn't leak into the rendered prompt.
 */
export function buildModePrompt(template, slug, context) {
  const ctx = { ...context };
  delete ctx.run;
  const parts = [
    `You are career-ops in ${slug} mode.`,
    '',
    'Read these files first (they exist in the project root):',
    '  • cv.md',
    '  • config/profile.yml',
    '  • modes/_shared.md',
    `  • modes/${slug}.md`,
    '',
    'User-supplied context:',
    '```json',
    JSON.stringify(ctx, null, 2),
    '```',
    '',
    '─── modes/' + slug + '.md ───',
    '',
    template,
  ];
  return parts.join('\n');
}

export function buildEvaluationPrompt(jd) {
  return `You are career-ops. Evaluate this Job Description against the user's CV.

Read these files first (they exist in the project root):
  • cv.md
  • config/profile.yml
  • modes/_shared.md
  • modes/oferta.md

Then output the full A-G evaluation per modes/oferta.md (Role Summary, CV Match, Risks, Compensation,
Application Strategy, Verdict, Posting Legitimacy) and a 0-5 score.

JD:
"""
${jd}
"""
`;
}

export function buildDeepPrompt(company, role) {
  return `You are career-ops in deep-research mode. Produce a full company brief on ${company}${role ? ` for the role of ${role}` : ''}.

Read modes/deep.md for structure. Use WebFetch / WebSearch. Cover:
  1. Company snapshot (size, funding, runway, leadership)
  2. Engineering culture (stack, blogs, GitHub, conference talks)
  3. Recent news, layoffs, acquisitions, controversies
  4. Glassdoor/Levels.fyi/Blind sentiment
  5. Interview process intel
  6. Negotiation leverage points
  7. Three smart questions for the recruiter

Save the output to interview-prep/${slugify(company)}-${role ? slugify(role) : 'general'}.md
`;
}

export function buildApplyChecklist(url, jd) {
  return [
    `URL: ${url}`,
    '',
    '0. Run /career-ops apply in Claude Code with this URL — it will read the form via Playwright.',
    '1. Verify the posting is still live (check footer/navbar vs JD presence).',
    '2. Confirm CV is the latest (run sync-check, then PDF if score ≥ 4.0).',
    '3. Tailor the cover letter / "Why us?" answer using STAR+R proof points from cv.md.',
    '4. Answer EEO / sponsorship / start-date questions truthfully.',
    '5. Save filled answers to interview-prep/{company}-{role}.md before submitting.',
    '6. NEVER auto-submit — you (the human) click the final button.',
    '7. After submit: add row to data/applications.md (or write TSV to batch/tracker-additions/).',
    jd ? '\n--- JD excerpt ---\n' + jd.slice(0, 600) + (jd.length > 600 ? '\n…' : '') : '',
  ].join('\n');
}
