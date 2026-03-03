# Facebook Messenger → Alex — Connection Guide

## STATUS
- Webhook code: ✅ deployed at `handyandfriend.com/api/alex-webhook`
- FB_VERIFY_TOKEN: ✅ set in Vercel
- DEEPSEEK_API_KEY: ✅ set in Vercel
- Supabase: ✅ set in Vercel
- **FB_PAGE_ACCESS_TOKEN: ❌ NOT SET — this is the blocker**

## STEP 1: Create Meta App (5 min)

1. Go to https://developers.facebook.com/apps/
2. Click **Create App**
3. Select **Business** type
4. App name: `Handy Friend Messenger`
5. Link to Business Portfolio (or skip if you don't have one)
6. Click **Create App**

## STEP 2: Add Messenger Product (2 min)

1. In your new app dashboard, click **Add Product**
2. Find **Messenger** → click **Set Up**
3. You now have a Messenger section in the left sidebar

## STEP 3: Generate Page Access Token (3 min)

1. Go to **Messenger** → **Settings** in the left sidebar
2. Under **Access Tokens**, click **Add or Remove Pages**
3. Select the page: **Handy & Friend** (ID: 61588215297678)
4. Grant all requested permissions
5. Click **Generate Token** next to the page name
6. **COPY THE TOKEN** — you will need it in the next step

⚠️ This is a short-lived token. For a permanent token:
- Go to https://developers.facebook.com/tools/explorer/
- Select your app
- Select your page
- Request `pages_messaging` permission
- Click **Generate Access Token**
- Then exchange it for a long-lived token:
  ```
  GET https://graph.facebook.com/v19.0/oauth/access_token?
    grant_type=fb_exchange_token&
    client_id=YOUR_APP_ID&
    client_secret=YOUR_APP_SECRET&
    fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
  ```

## STEP 4: Add Token to Vercel (2 min)

1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Add variable:
   - **Name:** `FB_PAGE_ACCESS_TOKEN`
   - **Value:** paste the token from Step 3
   - **Environments:** Production, Preview, Development
3. Click **Save**
4. **Redeploy** the project (Settings → Deployments → Redeploy latest)

### Verify token is set:
```
curl https://handyandfriend.com/api/health | jq '.checks.fb_page_access_token'
# Should return: true
```

## STEP 5: Configure Webhook in Meta Dashboard (3 min)

1. Go to **Messenger** → **Settings** → **Webhooks**
2. Click **Add Callback URL**
3. Enter:
   - **Callback URL:** `https://handyandfriend.com/api/alex-webhook`
   - **Verify Token:** (the value you set as `FB_VERIFY_TOKEN` in Vercel)
4. Click **Verify and Save**
5. Under **Webhook Fields**, subscribe to:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

## STEP 6: Subscribe Page to App (1 min)

1. Still in **Messenger** → **Settings**
2. Under **Webhooks**, find your page
3. Click **Subscribe** next to Handy & Friend page
4. Confirm the subscription

## STEP 7: Set Up Get Started Button (optional, 2 min)

Run this command to configure the Get Started button:
```bash
curl -X POST "https://graph.facebook.com/v19.0/me/messenger_profile" \
  -H "Content-Type: application/json" \
  -d '{
    "get_started": {"payload": "GET_STARTED"},
    "greeting": [
      {
        "locale": "default",
        "text": "Hi {{user_first_name}}! I'\''m Alex from Handy & Friend. Ask me about TV mounting, painting, furniture assembly, or any home service — I'\''ll give you an instant estimate."
      },
      {
        "locale": "es_LA",
        "text": "Hola {{user_first_name}}! Soy Alex de Handy & Friend. Pregúntame sobre montaje de TV, pintura, armado de muebles — te doy un presupuesto al instante."
      }
    ]
  }' \
  "https://graph.facebook.com/v19.0/me/messenger_profile?access_token=YOUR_PAGE_ACCESS_TOKEN"
```

## STEP 8: Test the Connection (2 min)

1. Go to your Facebook page: https://www.facebook.com/profile.php?id=61588215297678
2. Click **Message** button
3. Type: "Hi, I need TV mounting"
4. You should get a response from Alex within 5-10 seconds
5. Verify the conversation appears in Supabase `ai_conversations` table

### If it doesn't work:
- Check Vercel function logs: `vercel logs --follow`
- Check health endpoint: `curl https://handyandfriend.com/api/health`
- Verify webhook status in Meta Dashboard → Messenger → Settings → Webhooks

## STEP 9: Set Messenger CTA on Page (1 min)

1. Go to your Facebook page
2. Click **Edit** on the CTA button below the cover photo
3. Select **Send Message**
4. Choose **Messenger**
5. Save

---

## HOW ALEX WORKS ON MESSENGER

1. Customer sends a message
2. Meta sends POST to `handyandfriend.com/api/alex-webhook`
3. Alex loads conversation history from Supabase
4. Phone-gate guard checks if customer shared phone number
5. If no phone → Alex asks for phone before giving prices
6. If phone captured → Alex gives exact pricing + cross-sells
7. Lead is saved to `leads` table with `source: 'facebook'`
8. Reply is sent back to customer via Messenger

**Guard modes:**
- First 3 messages without phone: soft ask
- 4+ messages without phone: strong phone gate
- After phone: full pricing + cross-sell

## MONITORING

Check daily:
```
curl "https://handyandfriend.com/api/health?type=funnel&hours=24" | jq '.metrics.lead_source_breakdown'
```

Facebook leads will appear as `"facebook": N` in the source breakdown.

## STOP-LOSS
- If Alex sends incorrect prices → check `lib/alex-one-truth.js` pricing
- If webhook stops working → check Vercel function logs
- If Meta rejects webhook → verify callback URL and verify token match
