/**
 * Security helpers — sanitizers and host-trust checks.
 *
 * These are project-wide invariants. NEVER duplicate them; route through
 * the named exports here. Any new ingress that takes user-supplied URL,
 * Markdown, or JD text MUST go through the matching helper.
 *
 * Tested via the route handlers (tests/url-validation, cv-xss,
 * jd-sanitize, security-headers).
 */

/**
 * True when HOST binds beyond loopback — i.e. listening on 0.0.0.0 or any
 * non-127.0.0.1/::1 interface. Used to gate Content-Security-Policy so
 * stricter limits only kick in when the UI is reachable from the network.
 */
export function isPubliclyExposed() {
  const host = (process.env.HOST || '127.0.0.1').trim();
  if (!host) return false;
  if (host === '127.0.0.1' || host === '::1' || host === 'localhost') return false;
  return true;
}

/**
 * Validate a string as a job-posting URL. Defends against:
 *   - bare strings ("not-a-url") that slip past scheme checks because
 *     they have no scheme to reject (FIX-M7)
 *   - templating chars < > " ' ` \\ that hint at injection attempts
 *   - non-http(s) schemes (javascript:, data:, file:, ftp:, vbscript:)
 *   - loopback hostnames (localhost / 127.0.0.1 / ::1) — a job board
 *     is never on the user's laptop, so anything pointing inward is
 *     almost certainly a misconfig or SSRF probe
 *   - obviously bogus length: <10 chars (a real URL needs at least
 *     "http://x.x") or >2000 chars (typical browser cap, anything
 *     longer is a paste mistake or a tracking-blob explosion)
 */
export function isValidJobUrl(input) {
  if (typeof input !== 'string') return false;
  const url = input.trim();
  if (url.length < 10 || url.length > 2000) return false;
  if (/[<>"'`\\\s]/.test(url)) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (!parsed.hostname) return false;
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') return false;
  return true;
}

/**
 * Sanitize a job-description text before it joins a prompt destined for
 * an LLM. Removes:
 *   - control bytes (NUL, ANSI escapes, etc.) that would confuse downstream
 *     terminals or trigger silent string-mangling in tooling
 *   - script tags, which neither contribute meaning nor belong in a JD
 *   - leading/trailing whitespace
 * Caps length at 50 KB — JDs over that size are paste mistakes, not real
 * postings, and bloat the prompt for no upside.
 */
export function sanitizeJobDescription(input) {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/\x1B\[[0-9;]*m/g, '')         // ANSI color escapes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars (keep \t \n \r)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  s = s.trim();
  if (s.length > 50_000) s = s.slice(0, 50_000);
  return s;
}

/**
 * Strip dangerous patterns from CV markdown before persisting.
 * Defense-in-depth — the client-side renderer also escapes everything,
 * but neutralizing the file at rest protects any consumer that bypasses
 * the renderer (e.g. raw `cat cv.md`, third-party tools, future endpoints).
 */
export function stripDangerousMarkdown(text) {
  if (!text) return '';
  let s = String(text).replace(/\x00/g, '');
  s = s
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form\s*>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');
  return s;
}
