# Unified Registry: Handy & Friend

Generated at: 2026-02-24 14:59:29 PST (2026-02-24 22:59:29 UTC)
Canonical project root: /Users/sergiikuropiatnyk/handy-friend-landing-v6

## 1) Canonical naming map (single source of truth)

| Scope | Canonical value | Current status |
|---|---|---|
| Local project directory | `handy-friend-landing-v6` | ACTIVE |
| GitHub repository | `2133611700c-sudo/handy-friend-web` | ACTIVE |
| Git remote origin | `git@github.com:2133611700c-sudo/handy-friend-web.git` | ACTIVE |
| Vercel project | `handy-friend-landing-v6` | ACTIVE |
| Public domain (apex) | `https://handyandfriend.com` | ACTIVE |
| Public domain (www) | `https://www.handyandfriend.com` | REDIRECT -> apex |
| Legacy domain | `https://handyandfiend.com` | LEGACY (still DNS-live, GitHub 404) |

## 2) DNS registry

- `handyandfriend.com` -> `76.76.21.21` (Vercel)
- `www.handyandfriend.com` -> `cname.vercel-dns.com` (+ `76.76.21.98`, `66.33.60.67`)
- `handyandfiend.com` -> `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages IPs)
- NS (both zones): `boyd.ns.cloudflare.com`, `walk.ns.cloudflare.com`

## 3) HTTP and SSL registry

- `https://handyandfriend.com` -> `200 OK`
- `https://www.handyandfriend.com` -> `308` -> `https://handyandfriend.com/`
- `https://handyandfiend.com` -> `404` from `GitHub.com`
- `https://handyandfriend.com/robots.txt` -> `200`
- `https://handyandfriend.com/sitemap.xml` -> `200`
- SSL apex: `CN=handyandfriend.com`, issuer `Let's Encrypt R13`, valid `2026-02-24`..`2026-05-25`
- SSL www: `CN=www.handyandfriend.com`, issuer `Let's Encrypt R13`, valid `2026-02-24`..`2026-05-25`

## 4) GitHub registry

- Repo: `2133611700c-sudo/handy-friend-web`
- `has_pages=false`
- `homepage=https://handyandfriend.com`
- `GET /repos/2133611700c-sudo/handy-friend-web/pages` -> `404` (Pages disabled)
- `friend/fiend` repo scan in owner account: only `handy-friend-web` is present

## 5) Vercel registry

- Active project: `handy-friend-landing-v6`
- Latest production deployment: `dpl_t1VpjFDKGDNpD1R6oeWNokfcS6RL`
- Active public aliases: `handyandfriend.com`, `www.handyandfriend.com`
- Legacy alias `handy-fiend-landing-v6.vercel.app` removed from active alias list
- Verification: `https://handy-fiend-landing-v6.vercel.app` -> `404 DEPLOYMENT_NOT_FOUND`
- Note: `vercel inspect` may still print stale alias history for the deployment metadata

## 6) Public vs service URLs (to avoid false outage alarms)

Public production URL:
- `https://handyandfriend.com` only

Service URLs (expected access controls):
- `https://handy-friend-landing-v6.vercel.app` -> `401` (SSO protected)
- `https://handy-friend-landing-v6-sergiis-projects-8a97ee0f.vercel.app` -> `401`
- `https://handy-friend-landing-v6-git-main-sergiis-projects-8a97ee0f.vercel.app` -> `401`

These 401 responses do **not** mean public production is down.

## 7) GA4 / Google Ads registry (current, partially blocked by auth automation)

Observed GA4 account: `MessengInfo` (`381681622`)

Observed properties:
- `p525499430` — property name `Handy & Friend`
- `p525623234` — property name `https://handyandfriend.com`
- `p521301293` — property name `MessengInfo_Web`

Google Ads link observations from user-provided admin screens (2026-02-24):
- In `p525499430`: link exists to Ads account `637-606-8452`, account label shown as `Handy Fiend`
- In `p525623234`: `Google Ads links = 0`

Automation status:
- Playwright can open GA URL but lands on Google sign-in (no reusable authenticated browser session in automation context)
- Therefore GA4/Ads mutations are not executed yet from CLI automation

## 8) Remaining actions for full single-project consolidation

1. Decide canonical GA4 property (recommended: property that owns stream `G-Z05XJ8E281`).
2. Keep Ads link `637-606-8452` only on canonical property; remove link from non-canonical property.
3. In Google Ads, rename account label `Handy Fiend` -> `Handy & Friend`.
4. Remove legacy DNS A records for `handyandfiend.com` from Cloudflare zone.
5. Re-run validation and confirm `fiend` references in active config = 0.

## 9) File-system note

Current shell cwd from user environment points to `/Users/sergiikuropiatnyk/Downloads/handy-fiend-landing-v6`,
but active git project is `/Users/sergiikuropiatnyk/handy-friend-landing-v6`.
Keep operations on the canonical root above.
