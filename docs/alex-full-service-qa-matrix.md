# Alex Full Service QA Matrix (EN/RU/ES)

Date: 2026-03-02

## Scope
- Services: cabinet_painting, flooring_lvp, interior_painting, tv_mounting, furniture_assembly, plumbing_minor, electrical_minor
- Languages: EN, RU, ES
- Modes per service/language: pre-phone and post-phone
- Checks:
  - Pre-phone: no dollar amounts, asks phone
  - Post-phone: pricing allowed
  - Material policy consistency:
    - Cabinets: premium paint/primer/degreasing/prep included
    - All other services: labor-only, client buys/provides materials
  - No markdown artifacts

## Result Summary
- Total service-language pairs: 21
- PASS: 21
- FAIL: 0

## Matrix
| Service | EN | RU | ES |
|---|---|---|---|
| cabinet_painting | PASS | PASS | PASS |
| flooring_lvp | PASS | PASS | PASS |
| interior_painting | PASS | PASS | PASS |
| tv_mounting | PASS | PASS | PASS |
| furniture_assembly | PASS | PASS | PASS |
| plumbing_minor | PASS | PASS | PASS |
| electrical_minor | PASS | PASS | PASS |

## Web/Mobile Widget Smoke
- Desktop widget: PASS (chat opens, send/receive works, phone-first gate observed).
- Mobile widget (375px): PASS (chat opens, send/receive works, phone-first gate observed).
- Policy in widget responses aligns with API behavior (same backend flow).

## Source of truth
- Prompt rules: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/lib/alex-one-truth.js`
- Runtime guard/capture/policy enforcement: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/api/ai-chat.js`
- Audit notes: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/docs/alex-unification-audit.md`

## Conclusion
- Unified scenario is active with no conflicting pricing/material logic across tested services and languages.