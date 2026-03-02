# ALEX v7 BACKUP

Legacy v7 prompt is preserved in `/Users/sergiikuropiatnyk/handy-friend-landing-v6/api/ai-chat.js` under `SYSTEM_PROMPTS`.

Rollback option:
1. Set `ALEX_DYNAMIC_GUARD=off`.
2. Replace `ALEX_V8_BASE_PROMPTS[...]` usage with `SYSTEM_PROMPTS[...]` in `api/ai-chat.js`.
