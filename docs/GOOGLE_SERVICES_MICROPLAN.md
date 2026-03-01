# Google Services Microplan (Zero Delay)

## Goal
Finish all Google-facing readiness with tiny steps and no ambiguity.

## Track A: Already automated in code
1. [x] GA4 tag exists in `index.html` (`G-Z05XJ8E281`)
2. [x] `form_submit` event emit exists
3. [x] SMS lead event exists in JS
4. [x] Call/WhatsApp CTA events tagged
5. [x] Placement tracking has `google_business`

Validation command:
`node ops/google-services-gate.mjs`

## Track B: Manual account steps (must be done in Google UI)
1. [ ] GA4: Admin -> Events -> verify `form_submit` arrived
2. [ ] GA4: mark `form_submit` as Conversion
3. [ ] GA4 real-time: submit live form and confirm event in 2-3 min
4. [ ] Google Ads: link GA4 property `G-Z05XJ8E281`
5. [ ] Google Ads: import `form_submit` conversion
6. [ ] GBP: login and confirm profile status
7. [ ] GBP: publish 1 Update post with UTM link
8. [ ] GBP: add 3 photos and 3 Q&A entries

## Definition of done
1. Code gate passes: `failed = 0`
2. GA4 conversion visible and counting
3. Google Ads linked/imported conversion
4. GBP has at least one live post and updated assets

## Emergency fallback
If any Google UI step blocks:
1. Continue lead flow via Facebook + Nextdoor + site + Telegram.
2. Keep SLA < 15 min.
3. Re-attempt Google blocked step every 6 hours.
