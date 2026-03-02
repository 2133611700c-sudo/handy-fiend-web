/**
 * Health Check Endpoint for Pipeline Infrastructure
 * Verifies all backend dependencies are configured
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_ANON_KEY,
      deepseek_key: !!process.env.DEEPSEEK_API_KEY,
      telegram_bot: !!process.env.TELEGRAM_BOT_TOKEN,
      telegram_chat: !!process.env.TELEGRAM_CHAT_ID,
      resend_key: !!process.env.RESEND_API_KEY,
      alert_email: !!process.env.ALERT_EMAIL_PRIMARY,
      recaptcha_key: !!process.env.RECAPTCHA_SECRET_KEY
    }
  };

  // Test Supabase connection
  try {
    const { error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    checks.database = {
      connected: !error,
      error: error?.message || null,
      total_leads: count
    };
  } catch (err) {
    checks.database = {
      connected: false,
      error: err.message
    };
  }

  // Check pipeline columns
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('stage, outcome, contacted_at, response_time_min')
      .limit(1)
      .maybeSingle();

    checks.schema = {
      has_pipeline_columns: !error,
      error: error?.message || null
    };
  } catch (err) {
    checks.schema = {
      has_pipeline_columns: false,
      error: err.message
    };
  }

  // Check lead_events table
  try {
    const { count, error } = await supabase
      .from('lead_events')
      .select('*', { count: 'exact', head: true });

    checks.audit = {
      accessible: !error,
      error: error?.message || null,
      total_events: count
    };
  } catch (err) {
    checks.audit = {
      accessible: false,
      error: err.message
    };
  }

  // Determine overall status
  const hasAllEnv = Object.values(checks.environment).every(Boolean);
  const dbOk = checks.database?.connected;
  const schemaOk = checks.schema?.has_pipeline_columns;

  const status = dbOk && schemaOk ? 'ok' : 'degraded';
  const statusCode = status === 'ok' ? 200 : 503;

  return res.status(statusCode).json({
    status,
    statusCode,
    checks,
    ready_for_pipeline: dbOk && schemaOk && hasAllEnv,
    message: status === 'ok'
      ? 'All systems operational'
      : 'Some systems degraded - check details'
  });
}
