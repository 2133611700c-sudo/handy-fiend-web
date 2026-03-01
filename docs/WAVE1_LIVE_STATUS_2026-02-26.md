# Wave 1 Live Status (2026-02-26)

## Browser verification
1. ChatGPT: logged in, available.
2. Gemini: logged in, prompt test passed.
3. Perplexity: logged in, prompt test passed.
4. DeepSeek: logged in, prompt test passed.

## Platform execution state
1. Craigslist (`plc_cl_001`): paused in free-only mode (payment/phone verification step reached, not completed).
2. Nextdoor (`plc_nd_001`): claim flow open and ready.
3. Facebook (`plc_fb_001`): dashboard open, posting ready.
4. Taskrabbit/Thumbtack (`plc_tr_001`, `plc_tt_001`): onboarding page open, manual profile completion gate.
5. Yelp/GBP: pending login/start.

## Free-mode policy applied
- Paid actions disabled by owner decision (free-only mode active).
- All CTA links include UTM + placement_id.
- Post pack generated in `/docs/post-pack`.
