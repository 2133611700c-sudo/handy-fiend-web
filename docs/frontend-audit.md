# Frontend Audit — Handy & Friend (v2 scope)

## Scope
- Project: `/Users/sergiikuropiatnyk/handy-friend-landing-v6`
- Main page: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/index.html`
- Main frontend logic: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/assets/js/main.js`
- Main styles: `/Users/sergiikuropiatnyk/handy-friend-landing-v6/assets/css/main.css`

## Page structure map (index.html)
- Hero offer block: `index.html:165-173`
- Service grid + calculator: `index.html:176-329`
- Sticky bars / CTA anchors: `index.html:331-363`
- Tracking helper block (GA4 + click events): `index.html:377-438`
- Testimonials/reviews: `index.html:438-503`
- Lead form: `index.html:504-575`
- FAQ: `index.html:576-617`
- Final CTA: `index.html:618-633`
- Lead submit JS flow: `index.html:636-891`
- Chat widget UI + logic: `index.html:958-1301`

## Forms and submit contracts
- Main form id: `#leadForm` at `index.html:510`
- Endpoint: `POST /api/submit-lead` at `index.html:712`
- Photo upload endpoint: `POST /api/upload-lead-photos` at `index.html:812`
- Chat endpoint: `POST /api/ai-chat` at `index.html:1218`

## Chat widget map
- Trigger button: `#hf-chat-btn` at `index.html:1023`
- Messages container: `#hf-chat-msgs` at `index.html:1039`
- Render function: `renderMsg()` at `index.html:1116-1124`
- AI response flow: `sendToAI()` at `index.html:1201-1251`

## Analytics and external scripts
- GA4 `gtag`: `index.html:44-49`
- GTM head/noscript: `index.html:31-37` and `index.html:150-154`
- Meta Pixel init on `window.load`: `index.html:61-74`
- fbq runtime usage points: `index.html:72,73,424,702`

## WhatsApp link map
- Bottom bar WA link: `index.html:343`
- Form success WA link: `index.html:565`
- Final CTA WA link: `index.html:626`
- Safe WA generator helpers: `index.html:648-658`
- Safe link update on submit: `index.html:746`
- Calculator/result WA links in JS: `assets/js/main.js:2469-2477, 2777-2785, 2841, 2940`

## Baseline risky-copy findings (fixed in this implementation)
- Hero promo claim (`BUNDLE & SAVE 20%`) in old hero text and i18n fallback.
- Free-estimate absolute claim (`100% free`) in FAQ and i18n text.
- Response SLA claim (`within 10 minutes`) in FAQ/success/i18n strings.
- Numeric social proof (`500+ ...`) in testimonials/final CTA/i18n strings.
- Marketing wording (`licensed and insured`) in FAQ.
- Photos were required for lead form (`#leadPhotos required`).
- fbq was fired outside strict conversion scope (form input path).

## What was changed in phases 2–6
- Hero offer/subline/CTA text hardened for compliant conversion copy.
- Risky legal/copy claims replaced with policy-safe wording.
- Photos switched to optional with updated label.
- Safe WhatsApp message builder added for form-success flow.
- Meta Pixel scope reduced to PageView + Lead + phone click.
- Chat response markdown stripped before rendering to bubbles.
- Touch listener tuning and minor input debounce added for UI responsiveness.
