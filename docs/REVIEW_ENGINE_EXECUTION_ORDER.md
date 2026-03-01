# Review Engine - Execution Order (No Jumps)

Date: 2026-02-27

## Phase 1 - Google/Ads baseline
1. Done: GA4 `form_submit` set as key event.
2. Done: GA4 <-> Google Ads link verified.
3. Done: `form_submit` imported into Google Ads goals as lead-form action.
4. Done: conversion settings tuned (`Primary`, `One`, `Data-driven`, click window `30 days`, value `100 USD`).
5. Done: Ads `Call/SMS terms` accepted.
6. Done: Ads `Lead form terms` accepted.

## Phase 2 - Stable public review links
1. Done: route `/review` created via `vercel.json` rewrite to `/api/review-redirect`.
2. Done: route `/fb` created via `vercel.json` rewrite to `/api/fb-redirect`.
3. Done: serverless redirect handlers added:
   - `api/review-redirect.js` -> `GOOGLE_REVIEW_URL`
   - `api/fb-redirect.js` -> `FACEBOOK_PAGE_URL`
4. Done: env keys documented in `.env.local.example`.

## Phase 3 - Required inputs from owner (single blocking input)
1. Required: exact official GBP review URL from `Get more reviews`.
2. Action: set `GOOGLE_REVIEW_URL` in Vercel env.
3. Action: redeploy and test:
   - `https://handyandfriend.com/review`
   - `https://handyandfriend.com/fb`

## Phase 4 - Website + outbound scripts
1. Add site CTA block:
   - Button label: `Leave a Google Review`
   - URL: `/review`
   - Optional fallback button: `/fb`
2. Use non-gating SMS scripts:
   - review request to all customers equally
   - support line in separate message
3. Generate QR for `/review` (domain-stable QR).

## Phase 5 - GBP growth operations (free)
1. Finish GBP profile completeness (visibility issue in Search panel).
2. Publish weekly GBP updates (2-3/week).
3. Collect only real reviews (no filtering by rating, no fake reviews).
4. SLA: answer all reviews in <24h.

## Fast QA checklist
1. `/review` opens Google review form directly.
2. `/fb` opens Facebook page.
3. iPhone + Android QR scan works.
4. Incognito test works.
5. GA4 still receives `form_submit`.

## Policy guardrail
- Never do rating-based routing (review gating).
- Same public review link for all clients.
- Negative feedback handled in separate support channel.
