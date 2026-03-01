const { restInsert, logLeadEvent } = require('./_lib/supabase-admin.js');

const ALLOWED_ROLES = new Set(['system', 'assistant', 'user', 'tool']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  const { leadId, messages } = req.body || {};
  const safeMessages = Array.isArray(messages) ? messages.slice(0, 50) : [];

  if (!leadId || !safeMessages.length) {
    return res.status(400).json({ success: false, error: 'leadId and messages are required' });
  }

  const rows = [];
  for (const msg of safeMessages) {
    const role = String(msg?.role || '').toLowerCase();
    const text = String(msg?.text || '').trim();

    if (!ALLOWED_ROLES.has(role) || !text) continue;

    rows.push({
      lead_id: String(leadId),
      message_role: role,
      message_text: scrubSensitiveText(text).slice(0, 8000)
    });
  }

  if (!rows.length) {
    return res.status(400).json({ success: false, error: 'No valid messages to store' });
  }

  const inserted = await restInsert('ai_conversations', rows, { returning: false });
  if (!inserted.ok && !inserted.skipped) {
    await logLeadEvent(leadId, 'validation_failed', {
      stage: 'append_conversation',
      error: inserted.error || 'insert_failed'
    });
    return res.status(500).json({ success: false, error: 'Failed to store conversation' });
  }

  await logLeadEvent(leadId, 'ai_summary_saved', {
    message_count: rows.length
  });

  return res.status(200).json({ success: true, stored: rows.length, mode: inserted.skipped ? 'skipped' : 'supabase' });
}

function scrubSensitiveText(text) {
  return String(text || '')
    .replace(/sb_(publishable|secret|service_role)_[A-Za-z0-9._-]+/gi, '[redacted_key]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted_token]');
}
