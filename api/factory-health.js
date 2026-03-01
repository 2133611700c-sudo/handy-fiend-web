/**
 * Lightweight runtime health check.
 * Safe for production: returns only non-secret diagnostics.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const checks = {
    supabase_url: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    telegram_bot_token: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    telegram_chat_id: Boolean(process.env.TELEGRAM_CHAT_ID),
    resend_api_key: Boolean(process.env.RESEND_API_KEY),
    sendgrid_api_key: Boolean(process.env.SENDGRID_API_KEY)
  };

  const requiredForLeadCapture = checks.supabase_url;
  const healthy = requiredForLeadCapture;

  return res.status(healthy ? 200 : 503).json({
    ok: healthy,
    status: healthy ? 'healthy' : 'degraded',
    service: 'handy-friend-api',
    timestamp: new Date().toISOString(),
    runtime: {
      region: process.env.VERCEL_REGION || 'unknown',
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown'
    },
    checks
  });
}

