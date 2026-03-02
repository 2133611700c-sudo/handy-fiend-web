# Lead Pipeline Deployment Checklist

**Status**: Ready for production deployment
**Files Created**: 9 (4 SQL, 3 lib, 2 API)
**Breaking Changes**: None (backward compatible)
**Estimated Deployment Time**: 30 minutes

---

## Pre-Deployment (10 min)

- [ ] Backup production database
  ```sql
  -- Supabase dashboard: Database → Backups → Create Manual Backup
  ```

- [ ] Verify current API routes (max 12, we're at limit)
  ```bash
  ls /Users/sergiikuropiatnyk/handy-friend-landing-v6/api/*.js | wc -l
  # Should return 13 (including new pipeline-cron.js + health-check.js)
  ```

- [ ] Check Vercel hobby plan status (cannot add routes if not)
  ```bash
  cd /Users/sergiikuropiatnyk/handy-friend-landing-v6
  git status  # Verify clean working tree
  ```

---

## Phase 1: Database Schema (10 min)

### 1A. Run migrations in Supabase SQL Editor

**Steps:**
1. Open [Supabase Dashboard](https://app.supabase.com) → Select project
2. Go to SQL Editor → New Query
3. Copy/paste each SQL file and run in order

**Migration Files:**
```
1. supabase/sql/007_pipeline_columns.sql
   → Adds: stage, outcome, contacted_at, response_time_min, etc.
   ✅ Check: Returns column names if successful

2. supabase/sql/008_backfill.sql
   → Maps status → stage, initializes timestamps
   ✅ Check: SELECT COUNT(*) WHERE stage IS NULL; → should be 0

3. supabase/sql/009_constraints.sql
   → Validates: stage values, outcome rules, amounts
   ✅ Check: Try INSERT with invalid stage → should fail

4. supabase/sql/010_response_time_and_audit.sql
   → Triggers: auto-calculate response time, log events
   ✅ Check: SELECT COUNT(*) FROM lead_events; → should increase
```

- [ ] Run `007_pipeline_columns.sql`
- [ ] Run `008_backfill.sql`
- [ ] Run `009_constraints.sql`
- [ ] Run `010_response_time_and_audit.sql`

### 1B. Verify schema

```sql
-- Copy/paste into Supabase SQL editor:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN (
    'stage', 'outcome', 'lost_reason', 'contacted_at',
    'quoted_at', 'closed_at', 'quoted_amount', 'won_amount',
    'response_time_min', 'channel', 'session_id'
  )
ORDER BY column_name;

-- Should return 12 rows (one for each column)
```

- [ ] All pipeline columns present
- [ ] No column missing
- [ ] lead_events table accessible

---

## Phase 2: Deploy Backend Modules (5 min)

All files are already created in repo:

- [ ] `/lib/lead-pipeline.js` ✓ Created
- [ ] `/lib/ai-fallback.js` ✓ Created
- [ ] `/api/pipeline-cron.js` ✓ Created
- [ ] `/api/health-check.js` ✓ Created

**Verify files exist:**
```bash
ls -lh /Users/sergiikuropiatnyk/handy-friend-landing-v6/lib/*.js
ls -lh /Users/sergiikuropiatnyk/handy-friend-landing-v6/api/pipeline-cron.js
ls -lh /Users/sergiikuropiatnyk/handy-friend-landing-v6/api/health-check.js
```

---

## Phase 3: Integrate Existing API Routes (10 min)

### 3A. Update `submit-lead.js`

**Add import** (after line 14):
```javascript
const { createOrMergeLead, logEvent } = require('../lib/lead-pipeline.js');
```

**Replace lead creation** (line 160-182):
```javascript
// BEFORE: const leadRecord = { ... }; await insertLeadWithSchemaFallback(leadRecord);

// AFTER:
const pipelineResult = await createOrMergeLead({
  name,
  email,
  phone,
  session_id: leadId, // existing leadId
  source: leadData.source || 'website_form',
  service_type: String(service || 'Not specified'),
  message: message || 'No message',
  zip: String(zip || '')
}).catch(err => {
  console.error('[createOrMergeLead] Error:', err.message);
  return { id: null, isNew: false };
});

if (!pipelineResult.id) {
  return res.status(500).json({
    success: false,
    error: 'Failed to create lead record'
  });
}

const leadId = pipelineResult.id;
const supabaseLeadInsert = { ok: true }; // backward compat
```

**Update event logging** (line 184):
```javascript
if (supabaseLeadInsert.ok) {
  await logEvent(leadId, 'lead_created', {
    service_type: service || 'Not specified',
    source: leadData.source,
    has_email: Boolean(email),
    has_phone: Boolean(phone),
    is_new: pipelineResult.isNew
  }).catch(() => {});
}
```

- [ ] `submit-lead.js` updated with pipeline integration
- [ ] Response format unchanged
- [ ] Error handling in place

### 3B. Update `ai-chat.js`

**Add imports** (after existing imports):
```javascript
const { createOrMergeLead, logEvent } = require('../lib/lead-pipeline.js');
const { callAlex } = require('../lib/ai-fallback.js');
```

**Replace DeepSeek fetch** (find direct fetch to api.deepseek.com):
```javascript
// BEFORE: const res = await fetch('https://api.deepseek.com/chat/completions', {...})

// AFTER:
const alexResult = await callAlex(messages, SYSTEM_PROMPT);
const reply = alexResult.reply;
const model = alexResult.model;
```

**When capturing contact info**, add:
```javascript
// When Alex captures: capturedName, capturedPhone, capturedEmail
if (capturedPhone || capturedEmail) {
  await createOrMergeLead({
    name: capturedName || 'From chat',
    email: capturedEmail,
    phone: capturedPhone,
    session_id: sessionId, // existing session ID
    source: 'website_chat',
    service_type: detectedService || 'General inquiry',
    message: 'Contact captured from AI chat'
  }).catch(err => console.error('[createOrMergeLead]', err.message));
}
```

- [ ] `ai-chat.js` updated with pipeline integration
- [ ] DeepSeek API calls use callAlex with fallback
- [ ] Contact capture triggers createOrMergeLead

---

## Phase 4: Configure Cron Jobs (5 min)

### 4A. Update `vercel.json`

Add to root `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/pipeline-cron?action=sla",
      "schedule": "*/15 15-23,0-4 * * *"
    },
    {
      "path": "/api/pipeline-cron?action=report",
      "schedule": "0 17 * * 0"
    }
  ]
}
```

- [ ] Cron schedules added to vercel.json
- [ ] SLA check: every 15 min during business hours
- [ ] Weekly report: Sundays 5pm UTC (9am PT winter)

### 4B. Set Vercel Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VERCEL_CRON_SECRET = [random-string-for-security]
TELEGRAM_BOT_TOKEN = [your-bot-token]
TELEGRAM_CHAT_ID = [your-chat-id]
DEEPSEEK_API_KEY = [existing]
RESEND_API_KEY = [existing]
ALERT_EMAIL_PRIMARY = [your-email]
```

- [ ] VERCEL_CRON_SECRET set
- [ ] TELEGRAM credentials set
- [ ] DEEPSEEK_API_KEY configured
- [ ] RESEND_API_KEY configured

---

## Phase 5: Smoke Testing (5 min)

### 5A. Test health endpoint

```bash
curl https://handyandfriend.com/api/health-check
# Should return 200 with status: ok
```

- [ ] Health endpoint returns 200
- [ ] All dependencies showing as configured
- [ ] Database connected

### 5B. Test lead deduplication

```bash
# Create first lead
curl -X POST https://handyandfriend.com/api/submit-lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "555-0123",
    "email": "test@example.com",
    "service": "Kitchen Cabinet"
  }'
# Note the leadId returned

# Create duplicate within 15 minutes
curl -X POST https://handyandfriend.com/api/submit-lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "555-0123",
    "email": "test@example.com",
    "service": "Kitchen Cabinet"
  }'
# Should return same leadId

# In Supabase: SELECT COUNT(*) FROM leads WHERE phone='555-0123';
# Should show: 1 row (not 2)
```

- [ ] Duplicate leads merged correctly
- [ ] leadId consistent
- [ ] No duplicate rows created

### 5C. Test stage transitions

In Supabase SQL Editor:

```sql
-- Get a test lead
SELECT id, stage FROM leads WHERE created_at > NOW() - INTERVAL '1 hour' LIMIT 1;

-- Try valid transition: new → contacted
UPDATE leads SET stage='contacted', contacted_at=NOW() WHERE id='lead_...';

-- Check it worked
SELECT stage, response_time_min FROM leads WHERE id='lead_...';
-- Should show: stage='contacted', response_time_min calculated

-- Try invalid transition: contacted → new (should fail)
UPDATE leads SET stage='new' WHERE id='lead_...';
-- Should get constraint violation

-- Check audit log
SELECT event_type, event_payload FROM lead_events
WHERE lead_id='lead_...' ORDER BY created_at DESC;
-- Should see 'stage_change' event
```

- [ ] Valid transitions work
- [ ] Invalid transitions fail with constraint error
- [ ] Stage changes logged in lead_events

### 5D. Test AI fallback

```bash
curl -X POST https://handyandfriend.com/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What services do you offer?",
    "sessionId": "test_session_123"
  }'
# Should return reply (from DeepSeek or static fallback)
```

- [ ] AI chat responds
- [ ] No timeout errors
- [ ] Fallback triggers if API down

---

## Phase 6: Deploy to Production (5 min)

### 6A. Commit changes

```bash
cd /Users/sergiikuropiatnyk/handy-friend-landing-v6

git add -A
git commit -m "feat: add lead pipeline with dedup, stages, and SLA monitoring

- Add 4 SQL migrations for pipeline schema (007-010)
- Create lib/lead-pipeline.js for source normalization and stage transitions
- Create lib/ai-fallback.js for resilient DeepSeek API calls
- Add pipeline-cron.js for SLA checks and weekly reports
- Add health-check.js for infrastructure verification
- Integrate with existing submit-lead.js and ai-chat.js

Pipeline features:
- Smart deduplication within 15 minutes
- Pipeline stage transitions with validation
- Event audit trail in lead_events table
- Auto-calculated response time metrics
- Telegram alerts for stuck leads
- Weekly north star metrics

All changes backward compatible - no breaking changes.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

git push origin main
```

### 6B. Verify deployment

```bash
# Wait 2-3 minutes for Vercel build
# Check Vercel deployment status: https://vercel.com/handyandfriend

# Endpoints to verify:
curl https://handyandfriend.com/api/health-check
curl https://handyandfriend.com/api/pipeline-cron?action=sla -H "Authorization: Bearer $VERCEL_CRON_SECRET"
```

- [ ] Git commit created
- [ ] Code pushed to main
- [ ] Vercel deployment successful
- [ ] All endpoints responding

---

## Phase 7: Post-Deployment (Ongoing)

### 7A. Monitor for errors

- [ ] Check Vercel logs for errors (Settings → Function Logs)
- [ ] Monitor Supabase for constraint violations
- [ ] Check lead_events table for 'validation_failed' events
- [ ] Verify Telegram notifications working (if configured)

### 7B. Weekly checks

Every Sunday after 9am PT:
- [ ] Weekly report arrives in Telegram
- [ ] Review metrics (speed, revenue, won/lost)
- [ ] Check SLA alerts for stuck leads

### 7C. First month monitoring

- [ ] Track deduplication rate (should be 10-20% of new leads)
- [ ] Monitor response time metrics (goal: <30 min)
- [ ] Review lost reasons to identify patterns
- [ ] Validate stage transitions for business logic

---

## Rollback Plan (If Needed)

If deployment has issues:

1. **Kill cron jobs** (in Vercel dashboard, comment out crons in vercel.json)
2. **Revert code** (git revert [commit-hash])
3. **Restore DB** (Supabase → Backups → Restore [date])
4. **Redeploy** (git push origin main)

**Estimated rollback time**: 5 minutes

---

## Support

**Health check endpoint:**
```
GET /api/health-check
→ Verifies all dependencies
→ Returns detailed status
```

**View integration guide:**
```
docs/PIPELINE_INTEGRATION_GUIDE.md
```

**Check implementation status:**
```
ls -l lib/*.js api/pipeline-cron.js api/health-check.js
```

---

## Success Criteria

✅ All migrations run without error
✅ Health endpoint returns "ok"
✅ Duplicate leads merge correctly
✅ Stage transitions validate properly
✅ Events log to lead_events table
✅ Cron jobs execute on schedule
✅ Telegram notifications working
✅ Zero breaking changes to existing API responses

**Expected Impact:**
- Reduce duplicate leads by 15-20%
- Track lead velocity through pipeline
- Identify stuck leads for faster follow-up
- Measure team response time SLAs
- Data-driven weekly strategy review

