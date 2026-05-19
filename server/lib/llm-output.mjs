/**
 * v1.58.0 — strip agent/tool scaffolding the model sometimes echoes
 * into its prose so the SPA (which already renders markdown via
 * UI.md()) shows a clean, formatted brief instead of raw
 * `<tool_call>{…json…}</tool_call>` / `<tool_response>…</tool_response>`
 * blocks (reported on #/deep + Saved research).
 *
 * Conservative by design: only well-known agent-loop wrappers are
 * removed. Real fenced ```code blocks, tables, headings, etc. are left
 * untouched — this is NOT a markdown sanitizer (that's UI.md(), which
 * still escapes-first on the client).
 *
 * Pure + idempotent: safe to apply at the provider boundary AND again
 * when serving an already-saved file (older briefs on disk still get
 * cleaned on display).
 */

// <tool_call>…</tool_call>, <tool_response>…</tool_response>,
// <tool_use>…</tool_use>, <function_call>…</function_call> and the
// bracketed [TOOL_CALL]…[/TOOL_CALL] variants — case-insensitive,
// across newlines, non-greedy.
const SCAFFOLD_TAGS = /<\s*(tool_call|tool_response|tool_use|function_call|function_results?|thinking)\s*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const SCAFFOLD_BRACKETS = /\[\s*(TOOL_CALL|TOOL_RESPONSE|FUNCTION_CALL)\s*\][\s\S]*?\[\s*\/\s*\1\s*\]/gi;
// A self-closing / unterminated trailing scaffold tag at EOF (the
// stream was cut mid tool-call) — drop from the tag to end of string.
const SCAFFOLD_DANGLING = /<\s*(tool_call|tool_response|tool_use|function_call)\s*>[\s\S]*$/i;

/**
 * @param {string} md raw model output
 * @returns {string} cleaned markdown (never throws; '' for falsy input)
 */
export function cleanLlmMarkdown(md) {
  if (!md || typeof md !== 'string') return '';
  let s = md
    .replace(SCAFFOLD_TAGS, '')
    .replace(SCAFFOLD_BRACKETS, '');
  // Only treat a leftover OPEN tag with no close as dangling (don't
  // re-trigger on the already-stripped paired form).
  if (/<\s*(tool_call|tool_response|tool_use|function_call)\s*>/i.test(s)) {
    s = s.replace(SCAFFOLD_DANGLING, '');
  }
  // Collapse the blank-line craters the removed blocks leave behind.
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}
