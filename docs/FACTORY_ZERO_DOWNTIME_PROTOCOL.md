# Handy & Friend Factory Zero-Downtime Protocol

## Objective
Run the growth and lead pipeline in deterministic mode with measurable quality gates and rollback safety.

## Locked Agent Hierarchy

1. Perplexity: source collection + citations (research/fact layer)
2. Gemini: policy second pass + Google ecosystem checks
3. ChatGPT: strategy, brief, final owner of release decision
4. DeepSeek: bulk variants, consistency checks, rollout packaging

## Non-Negotiable Quality Gates

1. Source Gate: high-risk claims must have official source URLs.
2. Policy Gate: policy-sensitive copy must pass Gemini second pass.
3. Consistency Gate: same phone, URL, CTA, and geo in all outputs.
4. Attribution Gate: all placements include `utm_*` + `placement_id`.
5. One-Story Gate: before/after creatives must be same project scene.

If any gate fails: do not publish.

## Daily Operations

1. Build/refresh inventory
`node ops/build-asset-inventory.mjs`

2. Build post package
`node ops/build-post-pack.mjs`

3. Run hard guard checks
`node ops/factory-guard.mjs`

4. Verify runtime health
`GET /api/factory-health`

## Acceptance Criteria

1. `factory-guard` exits with code `0`
2. `factory-health` returns `ok: true` and `status: healthy`
3. Telegram one-tap panel present and callback schema active
4. Lead form keeps attachment limit at 6 photos

## Incident Protocol

Severity levels:

- P0: lead delivery broken, policy risk, or wrong contact routing
- P1: content pipeline blocked, panel generation failure
- P2: formatting inconsistencies

Response:

1. Freeze publish on P0/P1
2. Roll back to last known good creative/content package
3. Fix root cause
4. Re-run `factory-guard`
5. Resume only after all gates pass
