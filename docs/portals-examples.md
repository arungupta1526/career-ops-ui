# portals.yml — ready-to-paste blocks

Drop these into the `tracked_companies:` list of your `career-ops/portals.yml`
to enable EN scanning against verified Greenhouse / Ashby / Lever boards.

All entries below were live-probed and return jobs as of 2026-05-02. If a
slug ever 404s upstream, just remove that one entry — the scanner skips
companies whose API call fails and continues with the rest.

## Greenhouse boards

```yaml
  - name: Stripe
    careers_url: https://stripe.com/jobs/search
    api: https://boards-api.greenhouse.io/v1/boards/stripe/jobs
    scan_method: greenhouse
    notes: "Heavy Go + Ruby. Remote-friendly."
    enabled: true

  - name: GitLab
    careers_url: https://about.gitlab.com/jobs/
    api: https://boards-api.greenhouse.io/v1/boards/gitlab/jobs
    scan_method: greenhouse
    notes: "Fully remote; Go + Ruby."
    enabled: true

  - name: Vercel
    careers_url: https://vercel.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/vercel/jobs
    scan_method: greenhouse
    enabled: true

  - name: Cloudflare
    careers_url: https://www.cloudflare.com/careers/jobs/
    api: https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs
    scan_method: greenhouse
    notes: "Heavy Go usage."
    enabled: true

  - name: Discord
    careers_url: https://discord.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/discord/jobs
    scan_method: greenhouse
    enabled: true

  - name: Datadog
    careers_url: https://www.datadoghq.com/careers/
    api: https://boards-api.greenhouse.io/v1/boards/datadog/jobs
    scan_method: greenhouse
    notes: "Go-heavy. Remote EU options."
    enabled: true

  - name: Elastic
    careers_url: https://www.elastic.co/careers
    api: https://boards-api.greenhouse.io/v1/boards/elastic/jobs
    scan_method: greenhouse
    enabled: true

  - name: Grafana Labs
    careers_url: https://grafana.com/about/careers/
    api: https://boards-api.greenhouse.io/v1/boards/grafanalabs/jobs
    scan_method: greenhouse
    notes: "Go observability; remote EU welcome."
    enabled: true

  - name: CockroachDB
    careers_url: https://www.cockroachlabs.com/careers/
    api: https://boards-api.greenhouse.io/v1/boards/cockroachlabs/jobs
    scan_method: greenhouse
    notes: "Pure Go database company."
    enabled: true

  - name: Fastly
    careers_url: https://www.fastly.com/about/careers
    api: https://boards-api.greenhouse.io/v1/boards/fastly/jobs
    scan_method: greenhouse
    enabled: true

  - name: Twilio
    careers_url: https://www.twilio.com/en-us/company/jobs
    api: https://boards-api.greenhouse.io/v1/boards/twilio/jobs
    scan_method: greenhouse
    enabled: true

  - name: Coinbase
    careers_url: https://www.coinbase.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/coinbase/jobs
    scan_method: greenhouse
    notes: "Remote-first. Go-heavy."
    enabled: true

  - name: Reddit
    careers_url: https://www.redditinc.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/reddit/jobs
    scan_method: greenhouse
    enabled: true

  - name: Robinhood
    careers_url: https://careers.robinhood.com/
    api: https://boards-api.greenhouse.io/v1/boards/robinhood/jobs
    scan_method: greenhouse
    enabled: true

  - name: Affirm
    careers_url: https://www.affirm.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/affirm/jobs
    scan_method: greenhouse
    enabled: true

  - name: Lyft
    careers_url: https://www.lyft.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/lyft/jobs
    scan_method: greenhouse
    enabled: true
```

## Ashby boards

```yaml
  - name: Linear
    careers_url: https://linear.app/careers
    api: https://api.ashbyhq.com/posting-api/job-board/linear?includeCompensation=true
    scan_method: ashby
    notes: "Top-tier product company; Remote US/EU."
    enabled: true

  - name: Supabase
    careers_url: https://supabase.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/supabase?includeCompensation=true
    scan_method: ashby
    notes: "Remote-first; PostgreSQL/Go."
    enabled: true

  - name: PostHog
    careers_url: https://posthog.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/posthog?includeCompensation=true
    scan_method: ashby
    notes: "Remote-first analytics."
    enabled: true

  - name: Ramp
    careers_url: https://ramp.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/ramp?includeCompensation=true
    scan_method: ashby
    enabled: true

  - name: Modal Labs
    careers_url: https://modal.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/modal?includeCompensation=true
    scan_method: ashby
    enabled: true

  - name: Railway
    careers_url: https://railway.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/railway?includeCompensation=true
    scan_method: ashby
    notes: "Infra; remote-first."
    enabled: true

  - name: Browserbase
    careers_url: https://www.browserbase.com/careers
    api: https://api.ashbyhq.com/posting-api/job-board/browserbase?includeCompensation=true
    scan_method: ashby
    enabled: true
```

## Lever boards

```yaml
  - name: JetBrains
    careers_url: https://www.jetbrains.com/careers/jobs/
    api: https://api.lever.co/v0/postings/jetbrains
    scan_method: lever
    notes: "Czech / EU. Go-heavy backend."
    enabled: true
```

## RU portals (extension recognized by career-ops-ui)

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # 1=Moscow, 2=SPb, 113=Russia, 1001=remote
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "PHP Symfony"
    - "PHP Laravel"
    - "PHP-разработчик"
    - "Senior Go"
    - "Golang Backend"
    - "Go-разработчик"
    - "Backend Senior"
    - "Тимлид PHP"
    - "Тимлид Go"
```

---

## How to find more boards

The detection is dead simple — for any company you suspect uses one of these
ATS systems, try:

```bash
curl -sS "https://boards-api.greenhouse.io/v1/boards/<slug>/jobs" -o /dev/null -w "%{http_code}\n"
curl -sS "https://api.ashbyhq.com/posting-api/job-board/<slug>?includeCompensation=true" -o /dev/null -w "%{http_code}\n"
curl -sS "https://api.lever.co/v0/postings/<slug>" -o /dev/null -w "%{http_code}\n"
```

`200` means there's a board with that slug. `404` means try a different slug.
The slug is usually the company name in lowercase, dash-separated, or the
subdomain of their careers site. Examples:

- `https://boards.greenhouse.io/instacart` → slug `instacart`
- `https://jobs.ashbyhq.com/linear` → slug `linear`
- `https://jobs.lever.co/jetbrains` → slug `jetbrains`
