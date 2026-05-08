/**
 * App-settings routes — reads and writes the parent project's .env so
 * career-ops Node scripts AND web-ui's dotenv loader pick up the same
 * source.
 *
 *   GET  /api/config → { envFile, keys, secretKeys, values }
 *   POST /api/config → writes KNOWN_KEYS only, applies live to process.env
 *
 * Secret keys are masked on read. Empty string deletes a key. Validation
 * via env-config.validateConfig — unknown keys are silently dropped to
 * prevent attacker-supplied env vars.
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PATHS } from '../paths.mjs';
import {
  KNOWN_KEYS,
  SECRET_KEYS,
  parseEnv,
  maskSecret,
  validateConfig,
  updateEnvFile,
} from '../env-config.mjs';

export function registerConfigRoutes(app) {
  app.get('/api/config', (_req, res) => {
    let parsed = {};
    if (existsSync(PATHS.envFile)) {
      try { parsed = parseEnv(readFileSync(PATHS.envFile, 'utf8')); } catch {}
    }
    const out = {};
    for (const k of KNOWN_KEYS) {
      const live = process.env[k];
      // Prefer the on-disk value (what the user just saved); fall back
      // to whatever's currently in process.env (set via shell).
      const v = parsed[k] !== undefined ? parsed[k] : live;
      out[k] = SECRET_KEYS.has(k) ? maskSecret(v) : (v || '');
    }
    res.json({ envFile: PATHS.envFile, keys: KNOWN_KEYS, secretKeys: [...SECRET_KEYS], values: out });
  });

  app.post('/api/config', (req, res) => {
    const body = req.body || {};
    const v = validateConfig(body);
    if (!v.ok) return res.status(400).json({ error: 'validation failed', details: v.errors });
    // Filter to known keys only — never write attacker-supplied env vars.
    const safe = {};
    for (const k of KNOWN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, k)) safe[k] = body[k];
    }
    try {
      mkdirSync(dirname(PATHS.envFile), { recursive: true });
    } catch {}
    const written = updateEnvFile(PATHS.envFile, safe);
    // Apply to the running process so the change takes effect immediately
    // (no restart needed). Iterate the SAFE map (not just written) so
    // empty-string requests delete the corresponding process.env var
    // even though updateEnvFile reports them as "deleted" rather than
    // "written".
    for (const [k, val] of Object.entries(safe)) {
      if (val === '' || val == null) delete process.env[k];
      else process.env[k] = val;
    }
    res.json({ ok: true, written });
  });
}
