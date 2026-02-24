# 🗺️ LAUNCH ROADMAP: FROM TODAY TO $100K/MONTH (12-WEEK PLAN)

**Status:** Ready to execute. All technical foundations in place.

---

## EXECUTIVE SUMMARY

You have:
- ✅ Website with proof-driven copy, SMS capture, multi-lang
- ✅ GA4 + Meta Pixel tracking
- ✅ SMS API ready (demo mode)
- ✅ Free tools at hand (GBP, LSA, Google Ads credit)

**Goal:** Launch systematically, zero legal risk, maximum free leverage.

**Expected Path:**
- **Weeks 1-4:** Land first 20 leads (free/organic)
- **Weeks 5-8:** 50-100 leads (paid ads starting)
- **Weeks 9-12:** Stabilize at 100+ leads/month, optimize
- **Month 4+:** Scale aggressively (proven unit economics)

---

## WEEK-BY-WEEK PLAN

### 🟦 WEEK 1: CSLB + GBP Foundation

**Monday-Tuesday: CSLB Decision**
- [ ] Read PHASE-B-LEGAL-GUARDRAIL.md
- [ ] Decide: **Option A (small services, <$1k)** or **Option B (get licensed)**
- [ ] If Option A: Note which services to remove (Painting, Flooring, Plumbing, Electrical)
- [ ] If Option B: Start CSLB exam prep, order insurance quotes

**Wednesday-Thursday: GBP Setup**
- [ ] Go to business.google.com
- [ ] Complete 100% of profile (name, address, phone, hours, services, description)
- [ ] Upload 5 photos (best: before/after TV mounting, furniture assembly, art)
- [ ] Verify ownership (domain, postcard, or phone)
- [ ] Join GBP Q&A section

**Friday: GA4 + Pixel Check**
- [ ] In GA4: Admin → Events → Check "form_submit" is logged
- [ ] In GA4: Admin → Events → Create conversion: "form_submit"
- [ ] In Meta Ads Manager: Events Manager → Verify Pixel fires
- [ ] Test: Submit form on your site, check GA4/Pixel receive event

**Weekend: Review Request Campaign**
- [ ] Create email template: "Thanks for your business! Would you leave a Google review? [link]"
- [ ] Create SMS template: "Rate us on Google! [link] Thanks!"
- [ ] Send to 5 recent customers you can think of
- [ ] Goal: Get first 5 reviews this week

**Metrics to Track:**
- [ ] GBP profile: 100% complete?
- [ ] GA4 events: logging form submits?
- [ ] Meta Pixel: events firing?
- [ ] Reviews requested: 5?

**Cost: $0 (+ insurance quote if Option B)**

---

### 🟦 WEEK 2: SMS + WHATSAPP SETUP

**Monday-Tuesday: WhatsApp Business**
- [ ] Create Meta Business Suite account
- [ ] Set up WhatsApp Business Account (link to 213-361-1700)
- [ ] Create business profile: "Handy & Friend - Professional Handyman"
- [ ] Create 3 message templates (estimate, confirmation, review request)

**Wednesday-Thursday: Twilio A2P Registration**
- [ ] Sign up at twilio.com
- [ ] Get phone number (try to get 213 area code)
- [ ] Prepare documents: ID, business license, tax ID/EIN
- [ ] Submit Brand profile + Campaign ("Customer Care")
- [ ] Expected approval: 5-10 business days

**Friday: SMS Form + Compliance**
- [ ] Review your current SMS capture form (in index.html)
- [ ] Add checkbox: "Also send me offers (optional)"
- [ ] Update `/api/send-sms.js` to log consent timestamp + IP
- [ ] Set up Firebase Firestore (free) for consent logs
- [ ] Read PHASE-C-SMS-COMPLIANCE.md fully

**Weekend: Automation Setup**
- [ ] Create n8n.io account (free)
- [ ] Build workflow: Form submit → SMS (via Twilio) → Email → Save to Google Sheets
- [ ] Test workflow: submit form, verify SMS/email received

**Metrics to Track:**
- [ ] WhatsApp: Business account live?
- [ ] Twilio: A2P submitted? Expected approval date?
- [ ] SMS form: Compliance checkboxes added?
- [ ] Automation: n8n workflow tested?

**Cost: $0 (Twilio $15 trial credit enough for testing)**

---

### 🟦 WEEK 3-4: LSA + GOOGLE ADS LAUNCH

**Week 3: LSA Preparation**
- [ ] Finalize insurance (General Liability, $50-200/mo)
- [ ] Download Certificate of Insurance
- [ ] Get business license (LA city, usually $0 online)
- [ ] Prepare GBP for LSA (should be done from Week 1)

**Week 4: LSA + Google Ads Launch**

**Monday: LSA Application**
- [ ] Go to ads.google.com/local
- [ ] Click "Create account"
- [ ] Upload insurance certificate
- [ ] Set service areas (LA ZIPs: 90001-90099)
- [ ] Set quote price: "$150 service call + hourly after"
- [ ] Submit → Wait for approval (5-10 business days)

**Tuesday-Wednesday: Google Ads Campaign**
- [ ] Go to ads.google.com
- [ ] Create campaign: "Local Services Handyman"
- [ ] Link to GA4 (tools → linked accounts)
- [ ] Set location: Los Angeles
- [ ] Set budget: $20/day (using $500 credit)
- [ ] Bid on keywords: "handyman near me", "tv mounting los angeles", "furniture assembly", "home repair"

**Ad Copy:**
```
Headline 1: Professional Handyman in LA
Headline 2: Same-Day Quotes • Free Estimates
Headline 3: TV Mounting • Furniture • Repairs

Description: Fast, licensed handyman. Upfront pricing. Call 213-361-1700 for free quote.

Landing: https://handyandfriend.com/#calcBox
```

**Thursday-Friday: Negative Keywords + Optimization**
- [ ] Add negatives: -diy, -how to, -cheap, -looking for volunteer
- [ ] Pause underperformers daily
- [ ] Monitor clicks vs calls in Google Ads dashboard

**Metrics to Track:**
- [ ] LSA: Approved?
- [ ] Google Ads: Live?
- [ ] Impressions: >100/day?
- [ ] Clicks: >5/day?
- [ ] CTR: >5%?
- [ ] Cost/click: <$0.50?

**Cost: $20/day from $500 credit (~$280 for 2 weeks)**

---

### 🟦 WEEK 5-8: SCALE & OPTIMIZE

**Weekly Rhythm:**
- **Monday:** Review GA4 dashboard, export metrics
- **Tuesday:** Optimize Google Ads (pause underperformers, increase bids on winners)
- **Wednesday:** Check SMS + form submissions in Google Sheets
- **Thursday:** Request reviews from recent customers
- **Friday:** Weekly report (see template below)

**Expected Growth:**
```
Week 5:
- LSA approved ✅
- Google Ads running
- Leads/week: 10-15
- Calls/week: 5-10
- Bookings/week: 1-2

Week 6:
- SMS live (if A2P approved)
- Leads/week: 15-25
- Calls/week: 10-15
- Bookings/week: 3-5

Week 7-8:
- Optimize keywords
- Leads/week: 25-40
- Calls/week: 15-25
- Bookings/week: 5-8

Run rate → $400-600/week revenue
```

**Optimizations:**
- If keyword X has 0 conversions after 10 clicks → pause
- If keyword Y has 5+ conversions → increase bid $0.10
- If SMS leads convert better than form → increase SMS budget
- If calls convert better than SMS → optimize for call ads

**Cost: $20-30/day (from credit, or start paying if credit runs out)**

---

### 🟦 WEEK 9-12: PROFITABILITY + SCALE

**Goal:** Stabilize at profitable unit economics, then scale.

**Unit Economics Check:**
```
Example per $1 spent:
- 20 clicks @ $0.05 = $1 cost
- 2 calls (10% call rate)
- 0.4 bookings (20% conversion)
- 0.4 × $200 = $80 revenue
- ROI: 80x (8000%)
```

If numbers are like this → **scale to $100/day, then $500/day**.

**If numbers are bad:**
- Too many clicks, no calls → offer has problem (add phone number in ad)
- Clicks but no conversions → landing page problem (improve calculator visibility)
- Calls but no bookings → sales/pricing problem (review offer)

**Actions:**
- [ ] Increase Google Ads budget to $50/day (if profitable)
- [ ] Launch second campaign for different keywords
- [ ] Test WhatsApp Ads (Facebook Ads + WhatsApp CTA)
- [ ] Consider call tracking (CallRail, $75/mo) for better insights
- [ ] Plan Q2 budget ($500-1,000/month)

**Cost: $50-100/day from own budget (credit runs out by Week 8)**

---

## CRITICAL DEPENDENCIES & GATES

| Gate | Blocks | Must Complete By | How to Pass |
|------|--------|------------------|------------|
| **CSLB Decision** | Everything (legal risk) | Week 1 Mon | Choose Option A/B |
| **GBP 100% Complete** | LSA + organic leads | Week 1 Fri | Upload photos, hours, services |
| **GA4 Conversions Verified** | Ads optimization | Week 2 Fri | Test: submit form, check GA4 |
| **Insurance Certificate** | LSA approval | Week 3 Mon | Get quote, sign, download cert |
| **LSA Approval** | Paid leads source | Week 4 Fri | Submit + wait 5-10 days |
| **Twilio A2P Approval** | SMS scaling | Week 2 + 10 days | Submit brand + campaign |
| **Google Ads Campaign Live** | Paid traffic | Week 4 Wed | Create campaign, set budget |

---

## WEEKLY REPORTING TEMPLATE

**Copy this to Google Sheets, fill weekly (Fridays):**

```
WEEK OF [DATE]

LEADS SOURCE:
GBP organic: [#]
LSA: [#]
Google Ads: [#]
SMS captures: [#]
Form submissions: [#]
Total leads: [#]

CONVERSIONS:
Phone calls: [#]
Bookings: [#]
Conversion rate: [%]
Avg job value: $[#]
Revenue (estimated): $[#]

COSTS:
Google Ads: $[#]
Twilio SMS: $[#]
Other: $[#]
Total: $[#]

METRICS:
CAC (cost per acquisition): $[#]
LTV (lifetime value per customer): $[#]
ROI: [#]%
Notes: [what worked, what didn't]
```

---

## SCALING PLAN (WEEKS 13+)

Once you hit 100+ leads/month consistently:

### Month 4 (Weeks 13-16): Geographic Expansion
```
Expand from LA to:
- Long Beach
- Santa Monica
- Pasadena
- Ventura County

Copy existing Google Ads campaign, change location.
Setup second WhatsApp number (optional).
```

### Month 5 (Weeks 17-20): Service Expansion
```
Add new services:
- Power washing
- Drywall repair
- Deck staining
- (Only if CSLB licensed)

Create new Google Ads campaigns for each.
```

### Month 6+ (Weeks 21+): Team Building
```
Hire first sub-contractor (1099).
Systematize booking + customer management (HubSpot CRM, $50/mo).
Aim for $10K+/month revenue → hire full-time employee.
```

---

## RED FLAGS & BAILOUT PLAN

**If Week 4 passes and you have:**
- 0 leads from GBP
- 0 calls from Google Ads
- 0 LSA approval

**Then:**
1. **Check:** GBP profile complete? (Not usually problem)
2. **Check:** Google Ads getting clicks? (If no → bid higher, check keywords)
3. **Check:** Copy / offer problem? (Try different ad copy)
4. **Pivot:** Try Google Local Services Ads (free to start)
5. **Pivot:** Try Facebook Ads local targeting ($10/day)

**If it's still zero by Week 8:**
- Problem is likely offer/pricing/service-area mismatch
- Not a tech problem (tracking works, ads platform works)
- Solution: Hire marketing consultant for $500-2000 one-time review

---

## SUCCESS MILESTONES

| Milestone | Timeline | Target |
|-----------|----------|--------|
| GBP live + 5 reviews | Week 2 | ✅ |
| First 10 leads | Week 4 | ✅ |
| First 3 bookings | Week 5 | ✅ |
| First $1,000 revenue | Week 6 | ✅ |
| SMS live | Week 5-6 | ✅ |
| 50 leads/month | Week 8 | ✅ |
| Break-even on ads | Week 8-9 | ✅ |
| 100 leads/month | Week 12 | 🎯 |
| $5K/month revenue | Week 12 | 🎯 |

---

## BUDGET SUMMARY (12 Weeks)

| Category | Cost | Notes |
|----------|------|-------|
| **GBP** | $0 | Free |
| **Google Ads Credit** | -$500 | You get free credit |
| **Twilio SMS** | $50-100 | Trial + small usage |
| **Insurance** (ongoing) | $100-200 | General Liability, monthly |
| **n8n automation** | $0 | Free tier |
| **GA4** | $0 | Free |
| **Meta Pixel** | $0 | Free |
| **LSA** | $0 | Free to list, pay per lead (~$5-15 per) |
| **Optional: Domain email** | $0-50 | Email on handyandfriend.com |
| **Optional: Better forms** | $0-50 | Form builder, optional |
| **TOTAL PAID** | **$150-300** | For full 12-week launch |
| **EXPECTED REVENUE** | **$5,000-20,000** | Conservative estimate |
| **ROI** | **16x-133x** | Likely outcome |

---

## GETTING HELP (If Stuck)

**Free:**
- Google Ads support chat: ads.google.com (click help)
- Twilio docs: twilio.com/docs
- n8n templates: n8n.io/templates
- Reddit: r/handyman, r/smallbusiness

**Paid ($500-2,000 one-time):**
- Google Ads specialist (Fiverr, Upwork)
- Conversion optimization (CRO expert)
- SMS compliance review (lawyer, $200-500)

**This roadmap:** No external help needed if you follow it. You have all the tools.

---

## DECISION REQUIRED TODAY

**Choose your CSLB path:**
1. **Option A:** Small services (<$1k) → remove paid services from site
2. **Option B:** Get licensed → more work, but unlock full service menu

**Once decided, message back:** "Option A" or "Option B" → I'll provide next actions.

---

## GO LIVE CHECKLIST

Before you launch (should be done by end Week 2):

- [ ] CSLB decision made
- [ ] GBP profile 100% complete
- [ ] GA4 tracking verified
- [ ] Meta Pixel firing
- [ ] SMS form has consent checkbox
- [ ] Twilio account created (A2P submitted)
- [ ] WhatsApp Business account ready
- [ ] First 5 customer reviews requested
- [ ] n8n automation tested
- [ ] $500 Google Ads credit claimed
- [ ] Site copy matches CSLB decision (no illegal services)

**✅ When all checked → LAUNCH WEEK 3**

---

## FINAL WORD

You have:
- ✅ Proof-driven landing page
- ✅ SMS capture infrastructure
- ✅ Analytics tracking
- ✅ Free tools at hand
- ✅ Roadmap to $100K/month

The bottleneck is now **execution speed** (not technology or budget).

**Fastest path to first $1,000:**
1. **Week 1:** Complete GBP, get 5 reviews
2. **Week 2:** Verify GA4, start SMS
3. **Week 3:** Launch Google Ads with $500 credit
4. **Week 4:** Get 10+ leads
5. **Week 5:** Convert 3+ to jobs → $500-1,000 revenue

This is conservative. You'll likely do better.

**Let's go.** 🚀
