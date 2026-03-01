# Factory Toolchain Status (2026-02-26)

## Browser/Gemini
- Gemini web login active in browser session.
- Account label observed: `Jon (0665638312c@gmail.com)`.
- Live prompt execution works via browser automation.

## OpenClaw Gateway
- Gateway UI reachable at `http://127.0.0.1:18789`.
- Auth mode token is enabled.
- Health in UI: OK.

## DeepSeek
- Direct API test passed:
  - `GET /v1/models` -> HTTP 200
  - `POST /chat/completions` -> HTTP 200

## Gemini API key (server-side)
- Current provided API key is expired/invalid.
- `GET https://generativelanguage.googleapis.com/v1beta/models` -> HTTP 400 API_KEY_INVALID.

## Website + Telegram Pipeline
- `POST /api/submit-lead` works with required fields.
- `POST /api/telegram-webhook` command callback works (`/status` tested).
- One-tap reply flow previously validated and active.

## Operational Use for Sales Factory
- Use Gemini (browser) for strategy/copy ideation.
- Use site form + Telegram bot for lead capture/qualification.
- Use one-tap launcher for fast customer replies (SMS/WhatsApp/Call).
- Use DeepSeek API for scripted generation/automation tasks.

## Browser Agent Stack (Updated)
Primary multi-agent research stack for execution and cross-verification:
1. ChatGPT (chatgpt.com)
2. Gemini (gemini.google.com)
3. Perplexity (perplexity.ai)
4. DeepSeek (chat.deepseek.com)

Execution rule:
- Collect hypotheses from at least 2 agents.
- Validate claims with official source links.
- Proceed only when agreement is high and no policy conflict is found.
