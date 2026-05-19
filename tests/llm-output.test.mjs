/**
 * v1.58.0 — cleanLlmMarkdown strips agent/tool scaffolding the model
 * sometimes echoes into prose (#/deep + Saved research showed raw
 * <tool_call>{json}</tool_call> blocks). Pure + idempotent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLlmMarkdown } from '../server/lib/llm-output.mjs';

test('removes paired <tool_call>/<tool_response> blocks, keeps prose + markdown', () => {
  const raw = [
    'Сначала прочитаю файлы.',
    '',
    '<tool_call>',
    '{"name": "read_file", "parameters": {"path": "cv.md"}}',
    '</tool_call>',
    '<tool_response>',
    'Sergey Emelyanov, Senior Engineer',
    '</tool_response>',
    '',
    '# Deep Research',
    '',
    '## 1. Market',
    '- **bold** point',
    '| A | B |',
    '|---|---|',
    '| 1 | 2 |',
  ].join('\n');
  const out = cleanLlmMarkdown(raw);
  assert.ok(!/tool_call|tool_response/i.test(out), 'scaffolding tags must be gone');
  assert.ok(!out.includes('read_file'), 'tool JSON must be gone');
  assert.ok(out.includes('# Deep Research'), 'real markdown heading kept');
  assert.ok(out.includes('**bold** point') && out.includes('| A | B |'), 'markdown body kept');
  assert.ok(!/\n{3,}/.test(out), 'blank-line craters collapsed');
});

test('handles <tool_use>, <function_call>, [TOOL_CALL] and <thinking> variants', () => {
  const raw = 'A\n<tool_use>{"x":1}</tool_use>\nB\n[TOOL_CALL]do[/TOOL_CALL]\nC\n<function_call>f()</function_call>\nD\n<thinking>secret reasoning</thinking>\nE';
  const out = cleanLlmMarkdown(raw);
  for (const t of ['tool_use', 'function_call', 'TOOL_CALL', 'thinking', 'secret reasoning', '{"x":1}']) {
    assert.ok(!out.includes(t), `must strip ${t}`);
  }
  assert.equal(out.replace(/\s+/g, ' ').trim(), 'A B C D E');
});

test('drops a dangling unterminated trailing scaffold (stream cut mid tool-call)', () => {
  const raw = '# Brief\n\nReal content here.\n\n<tool_call>\n{"name":"web_search","parameters":{"query":"...';
  const out = cleanLlmMarkdown(raw);
  assert.ok(out.includes('# Brief') && out.includes('Real content here.'));
  assert.ok(!out.includes('tool_call') && !out.includes('web_search'));
});

test('idempotent + safe on already-clean / falsy input', () => {
  const clean = '# Title\n\nParagraph with `code` and **bold**.\n\n```\ncode block stays\n```';
  assert.equal(cleanLlmMarkdown(clean), clean.trim());
  assert.equal(cleanLlmMarkdown(cleanLlmMarkdown(clean)), clean.trim(), 'idempotent');
  assert.equal(cleanLlmMarkdown(''), '');
  assert.equal(cleanLlmMarkdown(null), '');
  assert.equal(cleanLlmMarkdown(undefined), '');
});

test('does NOT eat a fenced code block that merely mentions the word tool_call', () => {
  const raw = '# Doc\n\n```\nif (x) callTool(); // not a tool_call tag\n```\n\nDone.';
  const out = cleanLlmMarkdown(raw);
  assert.ok(out.includes('callTool()') && out.includes('Done.'), 'real code/prose preserved');
});
