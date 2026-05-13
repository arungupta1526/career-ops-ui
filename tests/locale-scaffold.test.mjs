/**
 * v1.13.0 — locale-aware scaffolding in prompt builders. The parent's
 * `modes/<slug>.md` body stays English (read-only per CLAUDE.md hard
 * rule #1), but the surrounding career-ops-ui scaffolding (the
 * "Read these files first" line, the "User-supplied context" label,
 * the role line) IS localized by SCAFFOLD_STRINGS.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildModePrompt,
  buildEvaluationPrompt,
  scaffold,
} from '../server/lib/prompts.mjs';

test('scaffold(): returns en text when locale unknown', () => {
  assert.match(scaffold('readFiles', 'klingon'), /Read these files/);
});

test('scaffold(): readFiles in ru', () => {
  assert.match(scaffold('readFiles', 'ru'), /прочти/);
});

test('scaffold(): userContext in ja', () => {
  assert.match(scaffold('userContext', 'ja'), /ユーザー/);
});

test('buildModePrompt: ru output uses localized role + readFiles + userContext lines', () => {
  const p = buildModePrompt('TEMPLATE BODY', 'project', { company: 'Acme' }, 'ru');
  assert.match(p, /Respond in Russian/);          // locale directive
  assert.match(p, /career-ops в режиме project/); // localized role line
  assert.match(p, /прочти эти файлы/);             // localized readFiles
  assert.match(p, /Контекст от пользователя/);     // localized userContext
  assert.match(p, /TEMPLATE BODY/);                // English body preserved verbatim
});

test('buildModePrompt: en is unchanged shape (back-compat with v1.10.x tests)', () => {
  const p = buildModePrompt('TEMPLATE BODY', 'project', {}, 'en');
  assert.match(p, /You are career-ops in project mode/);
  assert.match(p, /Read these files first/);
  assert.match(p, /User-supplied context/);
});

test('buildEvaluationPrompt: ko output uses localized role + readFiles', () => {
  const p = buildEvaluationPrompt('Senior backend role with Go + PostgreSQL …', 'ko');
  assert.match(p, /Respond in Korean/);
  assert.match(p, /당신은 career-ops/);
  assert.match(p, /파일들을 읽으세요/);
});
