#!/usr/bin/env node
/**
 * WS8.1 stub — `career-ops-ui init`. Interactive provider+key wizard
 * lands in WS8.2 (alongside the LLM_PROVIDER selector + #/config
 * OpenAI/Codex key field). For now it points the user at the
 * structured field form, which is the canonical write path.
 */
console.log([
  'career-ops-ui init — provider + key setup',
  '',
  'Interactive wizard ships in v1.39.0 (WS8.2). Today, configure your',
  'provider + key via the structured form:',
  '',
  '  career-ops-ui run        # start the server',
  '  open http://127.0.0.1:4317/#/config   → API keys & runtime tab',
  '',
  'Or run `career-ops-ui doctor` to see which keys are detected.',
].join('\n'));
