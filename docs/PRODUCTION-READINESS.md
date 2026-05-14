# Production Readiness — career-ops-ui v1.30.0

> Honest assessment, dated 2026-05-14. Updated each minor / patch release. Use this as the gate before deploying.

## TL;DR

`career-ops-ui` v1.30.0 is **ready for single-tenant production use** on a trusted machine (developer's laptop / personal VPS bound to loopback). Multi-tenant deployments and LAN-exposed instances require the v2.0.x P-12 auth gate first.

Since v1.9.1 (the original baseline of this doc) the codebase shipped 14 minor/patch releases — see `qa/REGRESSION-v1.29.2.md §12` for the 14 master invariants now in force (security envelope, multi-phase SSE contract, registry-driven source dispatch, paginator across list views, etc.) and `CHANGELOG.md` for per-release detail.

| Dimension | Status | Notes |
|---|---|---|
| Architecture | ✅ ready | Orchestrator-only `index.mjs` (~174 LOC); 14 focused route modules under `lib/routes/`. v1.29.0 added `server/lib/sources/registry.mjs` as the single source of truth for 11 adapters (6 EN ATS + 5 RU). |
| Tests | ✅ ready | **567** unit + acceptance + **32** Playwright (as of v1.30.0). ~93 % line / ~83 % branch coverage. `npm run test:ci` gates: tests + `check-no-also-leftovers` + 8-locale CHANGELOG parity. |
| Security (single-tenant loopback) | ✅ ready | CSP, SSRF guard, XSS strip, secret masking, log redaction. |
| Security (LAN exposure) | ⚠️ partial | No auth gate. **Do not** bind `HOST=0.0.0.0` on untrusted networks until P-12. |
| Operational | ⚠️ partial | Log rotation deferred to P-13; activity.jsonl + scan-history.tsv grow without bound. |
| CI/CD | ✅ ready | Node 18/20/22 matrix + Playwright e2e + browser smoke. Auto-release via release-please. |
| Documentation | ✅ ready | Full `docs/` tree, 8 locale CHANGELOGs, multi-CLI shims. |
| Observability | ⚠️ partial | Activity log + Health page only. No metrics / traces. Acceptable for single-tenant. |

## What's safe

### 1. Single-tenant deployment on `127.0.0.1:4317` (default)

The intended posture. The server binds to loopback by default, so only processes on the same host can reach the API. This is the design assumption every security feature was built around.

- **Auth:** Not required — the OS gates access via the loopback bind.
- **Secret handling:** `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` live in the parent project's `.env` (gitignored). The UI only round-trips them via `/api/config`, masking on read.
- **XSS:** All CV markdown ingress goes through `stripDangerousMarkdown`; the SPA renderer also escapes everything before any regex transformation.
- **SSRF:** `/api/pipeline/preview` walks redirects manually with per-hop `isValidJobUrl` validation, capped at 3 hops.
- **Path traversal:** Every `:param` that maps to a filesystem path is sanitized via `replace(/[^\w\-.]/g, '')`; DELETE routes additionally enforce a known suffix.

### 2. Trusted-LAN deployment with HTTPS reverse proxy

If the operator wires the UI behind nginx / Caddy / Cloudflare Tunnel with TLS termination AND IP allowlisting at the proxy layer, the UI itself remains usable. The trust boundary becomes the proxy. Same caveats as single-tenant.

## What's NOT ready yet

### 1. Public LAN / Internet exposure

`HOST=0.0.0.0` is supported (the CSP attaches in this mode) but the UI has **no authentication**. Anyone reachable on the network can read the user's CV, applications tracker, profile, and trigger LLM calls (burning tokens).

**Mitigation required:** P-12 (token-bearer auth gated by `WEB_UI_AUTH_TOKEN`). On the v2.0.x roadmap.

### 2. Multi-tenant or shared-host deployment

The UI has no concept of users. All state is shared. The `/api/config` endpoint writes to a single parent-project `.env`. Not designed for multi-user.

**Mitigation:** Out of scope. Use career-ops in single-tenant mode. Multi-tenancy would require a different architecture.

### 3. Long-running operational lifetimes (months without restart)

- `data/activity.jsonl` grows on every state-changing request. No rotation.
- `data/scan-history.tsv` grows on every fresh scan finding. No rotation.
- `output/web-jd-*.txt`, `web-deep-*.txt`, `gemini-smoke-*.txt` — temp files for the Gemini path, never cleaned up.

Currently fine — disk usage grows ~slowly, kilobytes per scan. P-13 (Persistent SSE log archive) will introduce rolling windows.

### 4. High-concurrency LLM calls

`/api/evaluate`, `/api/deep`, `/api/mode/:slug` Anthropic / Gemini calls have no in-process queue. If five tabs hit "Run live" simultaneously, the server serially fans out five upstream calls. Single-tenant assumption + intentional design — multi-user would need rate limiting + queueing.

## Risk register

| Risk | Severity | Mitigation status | Owning phase |
|---|---|---|---|
| LAN attacker reads cv.md / tracker via `HOST=0.0.0.0` | High in LAN-exposed deploy | Requires explicit `HOST=0.0.0.0` opt-in; CSP attaches; auth gate planned. | P-12 |
| Stored XSS via cv.md edit | Low | `stripDangerousMarkdown` defense-in-depth + client renderer escapes. Tested. | — (closed) |
| SSRF via /api/pipeline | Low | `isValidJobUrl` rejects loopback, file://, IP literals; preview walks redirects manually. Tested. | — (closed) |
| API-key leak via console / logs | Low | `runAnthropic` log-guard test enforces zero console output. Activity log redacts secrets. | — (closed) |
| Stuck child process holds SSE connection | Low | SIGTERM → SIGKILL escalation after 5 s; max-runtime cap of 30 min. Tested. | — (closed) |
| Unbounded log growth | Medium (long-running deploys) | None today. | P-13 |
| Prompt cost runaway | Low | 200 KB soft cap returns 413. | — (closed v1.9.1) |
| Tracker corruption from pipe in name | Was Medium | Fixed v1.9.1 (BF-1) — writer + parser now lossless. | — (closed) |
| Config write permission denied → unhandled rejection | Was Medium | Fixed v1.9.1 (BF-2) — clean 500 with details. | — (closed) |
| Stuck Anthropic call on huge prompt | Was Medium | Fixed v1.9.1 (BF-3/BF-4) — soft cap. | — (closed) |

## Deployment checklist

Before deploying v1.9.1:

1. ✅ `npm test` passes (284 / 284).
2. ✅ `npm run test:e2e:browser` passes (12 / 12).
3. ✅ `/api/health` returns `ok: true` for all required checks.
4. ✅ Parent career-ops project is set up (`cv.md`, `config/profile.yml`, `portals.yml` exist and are personalized).
5. ✅ `.env` in the parent project root contains the keys you intend to use (`ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `HH_USER_AGENT`).
6. ✅ If you need to expose beyond loopback: **stop**, wait for v2.0.x P-12.

## Roadmap to v2.0 (production-grade for any deployment)

| # | Phase | Severity | Goal |
|---|---|---|---|
| P-11 | TS/JSDoc adoption evaluation | Low | Re-evaluate the heuristic; not a blocker. |
| P-12 | Auth gate for LAN exposure | High (for LAN-exposed deploys) | Token-bearer auth gated by `WEB_UI_AUTH_TOKEN` env var. |
| P-13 | Persistent SSE log archive | Medium | Rolling log windows under `data/scan-logs/`. |
| P-14 | Plug-in scanners | Low | Auto-discovery of `lib/sources/*.mjs`. |
| P-15 | UI views split | Low | `scan.js` 461 LOC → split. |

P-12 is the only blocker for "production-grade for any deployment." The rest are quality-of-life improvements.

## Sign-off

This document is authoritative as of v1.9.1 (2026-05-08). It will be revisited at every minor release. If you find a gap not listed here, file an issue under `docs/reviews/REVIEW-<date>-<version>.md`.
