# Telegram Bot Setup Guide

## What's Configured

Your lead capture system now sends **instant Telegram notifications** when customers submit quotes.

### System Files
- `api/submit-lead.js` — Modified to call Telegram after successful lead capture
- `api/telegram-notify.js` — Standalone Telegram notification endpoint (optional direct use)
- `api/notify-lead.js` — Existing SMS notification endpoint (Twilio)

---

## Your Bot Details

| Property | Value |
|----------|-------|
| **Bot Token** | `8560889035:AAFeE9Y84T4oK-Lexq0BEOdPMsUPlYFk6d4` |
| **Chat ID** | `5593654628` |
| **Bot Name** | @HandyFriendLeadsBot |
| **Bot Owner** | Sergey (ru) |
| **Status** | Ready to activate |

---

## Step 1: Verify Bot in Telegram

1. Open Telegram
2. Search for **@HandyFriendLeadsBot** (or use direct link: https://t.me/HandyFriendLeadsBot)
3. Click **Start** to activate bot
4. Send a test message like "test" to confirm bot is responsive
5. Bot should reply (may be silent depending on configuration)

---

## Step 2: Add Environment Variables to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to **https://vercel.com/dashboard** → Select your project
2. Navigate to **Settings** → **Environment Variables**
3. Add two new variables:

   **Variable 1:**
   ```
   Name:  TELEGRAM_BOT_TOKEN
   Value: 8560889035:AAFeE9Y84T4oK-Lexq0BEOdPMsUPlYFk6d4
   ```

   **Variable 2:**
   ```
   Name:  TELEGRAM_CHAT_ID
   Value: 5593654628
   ```

4. Set both to environments: **Production**, **Preview**, and **Development**
5. Click **Save**

### Option B: Via Vercel CLI

```bash
vercel env add TELEGRAM_BOT_TOKEN
# Paste: 8560889035:AAFeE9Y84T4oK-Lexq0BEOdPMsUPlYFk6d4

vercel env add TELEGRAM_CHAT_ID
# Paste: 5593654628
```

---

## Step 3: Deploy Changes to Vercel

Your code changes are ready. Deploy the updated `submit-lead.js`:

```bash
cd /Users/sergiikuropiatnyk/handy-friend-landing-v6
vercel deploy --prod
```

Or push to git and Vercel will auto-deploy if connected.

---

## Step 4: Test the Integration

### Test via Form Submission

1. Go to **https://handyandfriend.com/**
2. Fill out the lead form:
   - Name: `Test Lead`
   - Email: `test@example.com`
   - Phone: `213-361-1700`
   - Service: `TV Mounting`
   - Message: `Testing Telegram notifications`
3. Click **Get Free Quote**
4. **Check your Telegram** — you should receive a formatted message within 1-2 seconds

### Expected Telegram Message

```
🔧 NEW LEAD!

Name: Test Lead
Phone: 2133611700
Email: test@example.com
Service: TV Mounting

Message:
Testing Telegram notifications

Lead ID: lead_1708960123456_abc123
Time: February 25, 2026, 2:30 PM PT

[📞 Call] • [💬 WhatsApp] • [📧 Email]
```

### Test via Direct API Call

```bash
curl -X POST https://handyandfriend.com/api/telegram-notify \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "2133611700",
    "email": "test@example.com",
    "service": "General",
    "message": "Test message",
    "leadId": "lead_test_001"
  }'
```

---

## Step 5: Rename Bot (Optional)

To give your bot a professional name like **@HandyFriendLeadsBot**:

1. Open Telegram → Search **@BotFather**
2. Click **Start**
3. Send: `/mybots`
4. Select **@HandyFriendLeadsBot**
5. Select **Edit Bot → Edit Commands / Edit Description / etc**
6. To rename, contact **@BotFather** directly for username changes (may require specific conditions)

**Alternative:** Create a new bot with desired name via @BotFather

---

## How It Works

### Flow Diagram

```
Customer submits form
        ↓
Validation + reCAPTCHA check
        ↓
Lead logged with unique ID
        ↓
Email sent (Resend/SendGrid/Demo)
        ↓
Telegram notification sent asynchronously
        ↓
Response returned to client
        ↓
Customer sees success message
```

### Key Features

✅ **Non-blocking** — Form response sent immediately, Telegram sent in background
✅ **Fallback-safe** — If Telegram fails, main lead capture succeeds
✅ **Formatted HTML** — Rich text with bold, code blocks, emojis, inline links
✅ **Lead ID tracking** — Each notification includes unique lead ID for correlation
✅ **Timezone-aware** — Timestamps in Los Angeles PT (matching business hours)
✅ **Direct actions** — One-click Call, WhatsApp, Email buttons in message

---

## Troubleshooting

### Problem: No Telegram message received

**Possible causes:**
1. Environment variables not set in Vercel
2. Bot token is incorrect or has been regenerated
3. Chat ID is wrong (use `/start @userinfobot` in Telegram to confirm your ID)
4. Vercel hasn't re-deployed after env var changes

**Solution:**
1. Verify env vars in Vercel dashboard → Settings → Environment Variables
2. Check Vercel deployment logs: https://vercel.com/dashboard → Deployments → Latest
3. Look for `[TELEGRAM_SENT]` or `[TELEGRAM_ERROR]` in logs

### Problem: Bot offline / unresponsive

**Solution:**
1. Restart bot: Search **@BotFather** → `/mybots` → Select bot → Restart
2. Verify token is still active (hasn't been regenerated)
3. Check Telegram internet connection

### Problem: Message formatting broken (HTML not rendering)

**Solution:**
- Telegram HTML parser is strict. Ensure quotes around HTML attributes
- Current code uses proper escaping via `escapeHtml()` function
- Check Vercel logs for encoding issues

---

## Production Checklist

- [ ] Environment variables set in Vercel (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
- [ ] Code deployed to production (`vercel deploy --prod`)
- [ ] Test form submission completes successfully
- [ ] Telegram message received within 1-2 seconds
- [ ] Message formatting displays correctly (emojis, bold text, links)
- [ ] Lead ID visible in message for tracking
- [ ] One-click action buttons work (Call, WhatsApp, Email)

---

## Next Steps

After verifying Telegram works:

1. **Setup Mailgun (Optional)** — Replace Resend with free Mailgun API (10k emails/month)
2. **Google Sheets Integration** — Archive all leads to searchable spreadsheet
3. **Configure GTM Tags** — Track Telegram notifications in analytics
4. **Deploy GA4 Events** — Mark phone_click, whatsapp_click, form_submit as key events

---

## Support

- **Telegram Bot API Docs:** https://core.telegram.org/bots/api
- **Get Chat ID:** Send any message to **@userinfobot** in Telegram
- **Create New Bot:** Talk to **@BotFather** → `/newbot`
- **Bot Documentation:** https://core.telegram.org/bots

---

**Setup Date:** February 25, 2026
**Bot Status:** Ready for production
**Cost:** FREE (Telegram Bot API is fully free)
