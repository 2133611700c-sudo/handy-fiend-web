# ALEX v8 Smoke Test — Automated Verification

## Quick Start

```bash
# Test all 5 scenarios
curl -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-1-'$(date +%s)'",
    "lang": "en",
    "messages": [
      {"role": "user", "content": "Hi, I have 18 kitchen cabinet doors. How much to repaint them white?"}
    ]
  }'
```

---

## TEST 1: Range Before Contact (NEW SESSION)

**Setup:**
```bash
SESSION="test1-$(date +%s%N)"
```

**Step 1a: Send initial message**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"en\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Hi, I have 18 kitchen cabinet doors. How much to repaint them white?\"}
    ]
  }" | jq '.reply'
```

**Expected Output (4-6 lines, emoji format):**
```
🎨 Cabinet painting - great choice!
🔹 For 18 doors: typically $2,700–$4,500
(Depending on finish: spray vs roller)
Quick question: any drawer fronts or island?
📲 What's your best phone to follow up?
```

**PASS Criteria:**
- ✅ 4-6 lines
- ✅ 🎨 at start, 📲 at end
- ✅ 🔹 before price range
- ✅ Range format ($X–$Y), NOT exact ($155/door)
- ✅ Asks for contact

**FAIL Criteria:**
- ❌ Exact price: "$155/door × 18 = $2,790"
- ❌ Per-unit breakdown
- ❌ Wall of text (>8 lines)
- ❌ No emoji format

---

## TEST 2: Exact Pricing After Contact (SAME SESSION)

**Step 2a: Send contact info + continue**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"en\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Hi, I have 18 kitchen cabinet doors. How much to repaint them white?\"},
      {\"role\": \"assistant\", \"content\": \"🎨 Cabinet painting - great choice!\n🔹 For 18 doors: typically \$2,700–\$4,500\n(Depending on finish: spray vs roller)\nQuick question: any drawer fronts or island?\n📲 What's your best phone to follow up?\"},
      {\"role\": \"user\", \"content\": \"I'm Sarah, 310-555-1234. Full package with spray, no drawers.\"}
    ]
  }" | jq '.reply'
```

**Expected Output:**
```
Thanks Sarah! 💬
🔹 18 doors × $155 (Full Package spray) = $2,790
Any drawer fronts or island?
Sergii will call within 1 hour to schedule your evaluation.
📲 What email should I send the estimate to?
```

**PASS Criteria:**
- ✅ Mentions name ("Thanks Sarah")
- ✅ Exact math: 18 × $155 = $2,790
- ✅ Cross-sell (drawer/island)
- ✅ "Sergii will call within 1 hour"
- ✅ Asks for email
- ✅ leadCaptured: true

**FAIL Criteria:**
- ❌ Still giving range instead of exact
- ❌ Lists all add-ons (degreasing, grain fill, etc.)
- ❌ TWO cross-sell questions
- ❌ No callback time mentioned
- ❌ leadCaptured: false

---

## TEST 3: Competitor Gate (3+ Questions, NEW SESSION)

**Setup:**
```bash
SESSION="test3-$(date +%s%N)"
```

**Step 3a: Q1 - Cabinet pricing**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"en\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"How much for cabinet painting per door?\"}
    ]
  }" | jq '.reply'
```

**Expected:** Range, ask for contact. No gate yet (1/3 messages).

**Step 3b: Q2 - Flooring pricing**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"en\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"How much for cabinet painting per door?\"},
      {\"role\": \"assistant\", \"content\": \"[response]\"},
      {\"role\": \"user\", \"content\": \"And what about flooring per sq ft?\"}
    ]
  }" | jq '.reply'
```

**Expected:** Range, ask for contact again. No gate yet (2/3 messages).

**Step 3c: Q3+ - Multiple services**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"en\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"How much for cabinet painting per door?\"},
      {\"role\": \"assistant\", \"content\": \"[response]\"},
      {\"role\": \"user\", \"content\": \"And what about flooring per sq ft?\"},
      {\"role\": \"assistant\", \"content\": \"[response]\"},
      {\"role\": \"user\", \"content\": \"What's your rate for interior painting? And TV mounting? And furniture assembly?\"}
    ]
  }" | jq '.reply'
```

**Expected Output (GATE ACTIVATED):**
```
No problem! For multi-service quotes, give us a call at (213) 361-1700.
Sergii can discuss all your projects and provide exact pricing.
```

**PASS Criteria:**
- ✅ Redirect to (213) 361-1700
- ✅ NO new pricing quotes given
- ✅ Mentions "multi-service" or "Sergii"
- ✅ Friendly tone

**FAIL Criteria:**
- ❌ Gives pricing on all 5 services
- ❌ Per-unit pricing ($155/door, $3/sqft)
- ❌ Continues normally as if nothing happened
- ❌ Never asked for contact

---

## TEST 4: Russian Language Support (NEW SESSION)

**Setup:**
```bash
SESSION="test4-$(date +%s%N)"
```

**Message:**
```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION\",
    \"lang\": \"ru\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"Сколько стоит покрасить 12 дверей на кухне?\"}
    ]
  }" | jq '.reply'
```

**Expected Output (Russian):**
```
🎨 Покраска шкафов - отличный выбор!
🔹 12 дверей: обычно $1,800–$2,400
(В зависимости от отделки)
Есть ящики или остров?
📲 Какой телефон для связи?
```

**PASS Criteria:**
- ✅ Response in Russian (Cyrillic)
- ✅ 4-6 lines
- ✅ 🎨 at start, 📲 at end
- ✅ 🔹 format
- ✅ Range ($X–$Y)

**FAIL Criteria:**
- ❌ Response in English
- ❌ Exact price ($155 за дверь или $1,860)
- ❌ Long unstructured text
- ❌ Branded stickers

---

## TEST 5: Telegram Notification (BONUS)

**After completing Test 2 (Sarah gave phone):**

Check Telegram bot message:
```
✅ New Lead: Sarah
📞 310-555-1234
🔨 Service: cabinet painting
💰 18 doors × $155 = $2,790
Session: [sessionId]
```

**PASS Criteria:**
- ✅ Message arrived in Telegram
- ✅ Contains: name, phone, service, quote
- ✅ Arrived immediately (not delayed)

**FAIL Criteria:**
- ❌ No message
- ❌ Missing phone/name
- ❌ Spam notifications from Tests 3 & 4 (no contact given)

---

## Scoring & Results

| Test | Scenario | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| 1 | Range before contact | 4-6 lines, emoji, $2.7K-$4.5K | | ✅/❌ |
| 2 | Exact after contact | $2,790 exact, cross-sell, callback | | ✅/❌ |
| 3 | 3+ msg gate | Redirect (213)361-1700 | | ✅/❌ |
| 4 | Russian support | Cyrillic, range, emoji | | ✅/❌ |
| 5 | Telegram notif | Message w/ contact, immediate | | ✅/❌ |

**Result:**
- All 5 PASS ✅ → ALEX v8 fully operational, ready for marketing
- Any FAIL ❌ → Contact Sergii, share exact response for prompt refinement

---

## Debug Mode

If something fails, get the full response:

```bash
curl -s -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-xyz","lang":"en","messages":[{"role":"user","content":"test query"}]}' | jq .
```

Check logs:
```bash
# Vercel logs
vercel logs handyandfriend-landing-v6

# Supabase logs (check ai_conversations & lead_events tables)
```
