/**
 * Combined Pipeline Cron Endpoint
 * Handles: SLA checks (every 15 min) + Weekly reports (Sunday)
 *
 * Since Vercel hobby plan max is 12 API routes, combined into one with query param:
 * ?action=sla → runs SLA escalation check
 * ?action=report → runs weekly north star report
 *
 * Vercel cron configuration in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/pipeline-cron?action=sla",
 *       "schedule": "*/15 15-23,0-4 * * *"  // Every 15 min, PT 8am-8pm year-round
 *     },
 *     {
 *       "path": "/api/pipeline-cron?action=report",
 *       "schedule": "0 17 * * 0"  // Sunday 5 PM UTC = PT 9am Sun (winter) / 10am (summer)
 *     }
 *   ]
 * }
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL_PRIMARY = process.env.ALERT_EMAIL_PRIMARY;

/**
 * Handler for combined cron
 */
export default async function handler(req, res) {
  // Verify this is a Vercel cron job (basic security)
  const token = req.headers['authorization'];
  if (!token || token !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    console.warn('[pipeline-cron] Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const action = req.query.action || 'sla';

  try {
    if (action === 'sla') {
      const result = await runSLACheck();
      return res.status(200).json(result);
    } else if (action === 'report') {
      const result = await runWeeklyReport();
      return res.status(200).json(result);
    } else {
      return res.status(400).json({ error: 'Unknown action', action });
    }
  } catch (err) {
    console.error('[pipeline-cron] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ============================================================================
// SLA CHECK — Monitors stuck leads
// ============================================================================

async function runSLACheck() {
  const { data: stuck, error } = await supabase
    .from('leads')
    .select('id, full_name, phone, service_type, source, created_at')
    .eq('stage', 'new')
    .lt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[SLA_CHECK] Query error:', error.message);
    return { error: error.message, checked: 0 };
  }

  if (!stuck || stuck.length === 0) {
    return { status: 'ok', checked: 0, message: 'No stuck leads' };
  }

  console.log(`[SLA_CHECK] Found ${stuck.length} stuck leads`);

  // Notify via Telegram
  for (const lead of stuck) {
    const ageMin = Math.round((Date.now() - new Date(lead.created_at)) / 60000);
    const icon = ageMin >= 60 ? '🔴' : ageMin >= 30 ? '🟡' : '⏰';

    const message = `${icon} LEAD WAITING ${ageMin}min\n` +
      `👤 ${lead.full_name || 'Unknown'}\n` +
      `📱 ${lead.phone || 'No phone'}\n` +
      `🔧 ${lead.service_type || 'Not specified'}\n` +
      `📍 Source: ${lead.source}`;

    await sendTelegram(message);

    // Email backup for leads waiting 30+ minutes
    if (ageMin >= 30 && ALERT_EMAIL_PRIMARY) {
      await sendEmailAlert(lead, ageMin);
    }
  }

  return {
    status: 'checked',
    count: stuck.length,
    message: `Monitored ${stuck.length} stuck leads`
  };
}

/**
 * Send Telegram notification
 */
async function sendTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[sendTelegram] Missing BOT_TOKEN or CHAT_ID');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await res.json();
    if (data.ok) {
      console.log('[sendTelegram] Sent:', data.result.message_id);
      return true;
    } else {
      console.error('[sendTelegram] Error:', data.description);
      return false;
    }
  } catch (err) {
    console.error('[sendTelegram] Fetch error:', err.message);
    return false;
  }
}

/**
 * Send email alert for stuck leads
 */
async function sendEmailAlert(lead, ageMin) {
  if (!RESEND_API_KEY) {
    console.warn('[sendEmailAlert] Missing RESEND_API_KEY');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'alerts@handyandfriend.com',
        to: ALERT_EMAIL_PRIMARY,
        subject: `⚠️ Lead stuck ${ageMin}min: ${lead.full_name || 'Unknown'}`,
        text: `Phone: ${lead.phone || 'N/A'}\n` +
              `Service: ${lead.service_type || 'N/A'}\n` +
              `Source: ${lead.source || 'N/A'}\n` +
              `ID: ${lead.id}`
      })
    });

    if (res.ok) {
      console.log('[sendEmailAlert] Sent');
      return true;
    } else {
      const data = await res.json();
      console.error('[sendEmailAlert] Error:', data);
      return false;
    }
  } catch (err) {
    console.error('[sendEmailAlert] Fetch error:', err.message);
    return false;
  }
}

// ============================================================================
// WEEKLY REPORT — North star metrics
// ============================================================================

async function runWeeklyReport() {
  try {
    // Query leads from past 7 days
    const { data, error } = await supabase
      .from('leads')
      .select('response_time_min, outcome, closed_at, lost_reason, won_amount, quoted_amount, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[WEEKLY_REPORT] Query error:', error.message);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { status: 'ok', leads: 0, message: 'No leads this week' };
    }

    // Calculate metrics
    const totalLeads = data.length;
    const avgSpeed = Math.round(
      data
        .filter(d => d.response_time_min)
        .reduce((sum, d) => sum + d.response_time_min, 0) /
      data.filter(d => d.response_time_min).length || 0
    );
    const won = data.filter(d => d.outcome === 'won').length;
    const lost = data.filter(d => d.outcome === 'lost').length;
    const revenue = data
      .filter(d => d.outcome === 'won')
      .reduce((sum, d) => sum + (d.won_amount || 0), 0);
    const pipeline = data
      .filter(d => !d.closed_at)
      .reduce((sum, d) => sum + (d.quoted_amount || 0), 0);

    // Find top lost reason
    const lostReasons = {};
    data
      .filter(d => d.outcome === 'lost' && d.lost_reason)
      .forEach(d => {
        lostReasons[d.lost_reason] = (lostReasons[d.lost_reason] || 0) + 1;
      });
    const topLost = Object.entries(lostReasons).sort((a, b) => b[1] - a[1])[0];

    // Build report message
    let msg = `📊 WEEKLY REPORT — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}\n\n`;

    if (totalLeads < 10) {
      msg += `⚠️ LOW SAMPLE (${totalLeads} leads) — directional only\n\n`;
    }

    msg += `⚡ Speed: ${avgSpeed || '—'} min ${avgSpeed <= 30 ? '🟢' : avgSpeed <= 60 ? '🟡' : '🔴'}\n`;
    msg += `💰 Revenue: $${Math.round(revenue)} | Pipeline: $${Math.round(pipeline)}\n`;
    msg += `✅ Won: ${won} | 🔴 Lost: ${lost} | Top: ${topLost ? topLost[0] : '—'}\n`;
    msg += `📈 Leads: ${totalLeads}\n`;

    if (totalLeads >= 20) {
      if (avgSpeed > 60) msg += `\n⚠️ Speed >60min — priority issue`;
      if (totalLeads < 5) msg += `\n⚠️ <5 leads — increase outreach`;
    } else {
      msg += `\n📌 <20 leads — skip strategic decisions`;
    }

    // Send via Telegram
    await sendTelegram(msg);

    return {
      status: 'ok',
      leads: totalLeads,
      revenue,
      avgSpeed,
      won,
      lost
    };
  } catch (err) {
    console.error('[WEEKLY_REPORT] Error:', err.message);
    return { error: err.message };
  }
}
