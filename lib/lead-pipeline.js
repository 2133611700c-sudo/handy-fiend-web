/**
 * Lead Pipeline Module for Handy & Friend
 *
 * Core backend logic for:
 * - Source normalization
 * - Smart deduplication (soft dedup)
 * - Lead creation/merging
 * - Pipeline stage transitions
 * - Event logging
 *
 * Imported by: submit-lead.js, ai-chat.js, API handlers
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ============================================================================
// SOURCE NORMALIZATION
// ============================================================================

const SOURCE_MAP = {
  'direct': 'website_form',
  'ai_chat': 'website_chat',
  'fb': 'facebook',
  'ig': 'instagram',
  'wa': 'whatsapp',
  'tel': 'phone',
  'call': 'phone',
  'ref': 'referral',
  'google': 'google_business',
  'gbp': 'google_business'
};

const VALID_SOURCES = new Set([
  'website_chat', 'website_form', 'exit_intent', 'calculator',
  'facebook', 'instagram', 'whatsapp', 'phone', 'referral',
  'nextdoor', 'google_business', 'yelp', 'other'
]);

/**
 * Normalize source to standardized value
 * Handles legacy values for backward compat: 'direct' and 'ai_chat'
 * @param {string} raw - Raw source from user/system
 * @returns {string} Normalized source value
 */
function normalizeSource(raw) {
  if (!raw) return 'other';
  const key = String(raw).toLowerCase().trim();
  if (SOURCE_MAP[key]) return SOURCE_MAP[key];
  if (VALID_SOURCES.has(key)) return key;
  return 'other';
}

// ============================================================================
// DEDUPLICATION (SOFT DEDUP)
// ============================================================================

/**
 * Find duplicate lead by phone, email, or session_id
 * CRITICAL: Uses maybeSingle() NOT single() to avoid PGRST116 errors
 *
 * @param {object} params - {phone, email, session_id, service_type}
 * @returns {Promise<string|null>} Lead ID if duplicate found, null otherwise
 */
async function findDuplicate({ phone, email, session_id, service_type }) {
  // Priority 1: Same session = always same lead
  if (session_id) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('session_id', session_id)
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }

  // Priority 2: Same phone + same service within 15 min
  if (phone) {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let query = supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1);

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    const { data } = await query.maybeSingle();
    if (data) return data.id;
  }

  // Priority 3: Same email + same service within 15 min
  if (email) {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let query = supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1);

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    const { data } = await query.maybeSingle();
    if (data) return data.id;
  }

  return null;
}

// ============================================================================
// CREATE OR MERGE LEAD
// ============================================================================

/**
 * Create new lead or merge with existing duplicate
 * Smart merge: fills in missing fields without overwriting
 *
 * @param {object} leadData - {phone, email, session_id, source, service_type, ...rest}
 * @returns {Promise<{id: string, isNew: boolean}>} Lead record
 */
async function createOrMergeLead(leadData) {
  const { phone, email, session_id, source, service_type, name, message, ...rest } = leadData;
  const normalizedSource = normalizeSource(source);

  const existingId = await findDuplicate({ phone, email, session_id, service_type });

  if (existingId) {
    // Load full existing record for smart merge
    const { data: existing, error: fetchErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', existingId)
      .maybeSingle();

    if (fetchErr) {
      console.error('[findDuplicate] Fetch error:', fetchErr.message);
      throw fetchErr;
    }

    if (existing) {
      const updates = { updated_at: new Date().toISOString() };

      // Smart merge: only fill in missing fields
      if (name && !existing.full_name) updates.full_name = name;
      if (phone && !existing.phone) updates.phone = phone;
      if (email && !existing.email) updates.email = email;

      // Append message history
      if (message) {
        updates.problem_description = (existing.problem_description || '')
          + (existing.problem_description ? '\n---\n' : '')
          + message;
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length > 1) {
        const { error: updateErr } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', existingId);

        if (updateErr) throw updateErr;

        await logEvent(existingId, 'merge', {
          merged_fields: Object.keys(updates),
          source: normalizedSource
        }).catch(err => console.error('[logEvent merge] Error:', err.message));
      }
    }

    return { id: existingId, isNew: false };
  }

  // Create new lead
  const newLeadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const { error: insertErr } = await supabase
    .from('leads')
    .insert({
      id: newLeadId,
      ...rest,
      full_name: name || 'Unknown',
      phone,
      email,
      session_id,
      service_type,
      source: normalizedSource,
      stage: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (insertErr) throw insertErr;

  return { id: newLeadId, isNew: true };
}

// ============================================================================
// STAGE TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS = {
  'new': ['contacted', 'closed'],
  'contacted': ['qualified', 'closed'],
  'qualified': ['quoted', 'closed'],
  'quoted': ['closed']
};

/**
 * Transition lead to new stage with validation
 * All validation in API layer, NOT in DB triggers
 * Logs validation failures as events
 *
 * @param {string} leadId - Lead ID
 * @param {string} newStage - Target stage
 * @param {object} data - Stage-specific data {outcome, won_amount, lost_reason, etc}
 * @returns {Promise<{success?: boolean, error?: string, stage?: string}>}
 */
async function transitionLead(leadId, newStage, data = {}) {
  // 1. Get current FULL lead state
  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (fetchErr || !lead) {
    return { error: 'Lead not found', code: 'NOT_FOUND' };
  }

  // 2. Validate transition
  const allowed = VALID_TRANSITIONS[lead.stage];
  if (!allowed || !allowed.includes(newStage)) {
    // Log OUTSIDE of DB transaction — always saves
    await logEvent(leadId, 'validation_failed', {
      old_stage: lead.stage,
      attempted: newStage,
      reason: `Invalid: ${lead.stage} -> ${newStage}`
    }).catch(err => console.error('[logEvent validation_failed]', err.message));

    return { error: `Invalid transition: ${lead.stage} -> ${newStage}`, code: 'INVALID_TRANSITION' };
  }

  // 3. Stage-specific requirements
  if (newStage === 'closed' && data.outcome === 'won') {
    if (!data.won_amount || data.won_amount <= 0) {
      return { error: 'WON requires won_amount > 0', code: 'MISSING_WON_AMOUNT' };
    }
    if (!data.quoted_amount && !lead.quoted_amount) {
      return { error: 'WON requires quoted_amount > 0', code: 'MISSING_QUOTED_AMOUNT' };
    }
  }

  if (newStage === 'closed' && data.outcome === 'lost') {
    if (!data.lost_reason || !['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].includes(data.lost_reason)) {
      return { error: 'LOST requires lost_reason (L1-L6)', code: 'INVALID_LOST_REASON' };
    }
  }

  if (newStage === 'closed' && !data.outcome) {
    return { error: 'CLOSED requires outcome (won or lost)', code: 'MISSING_OUTCOME' };
  }

  // 4. Build update
  const now = new Date().toISOString();
  const update = { stage: newStage, updated_at: now };

  if (newStage === 'contacted') {
    update.contacted_at = data.contacted_at || now;
    // response_time_min calculated by DB trigger automatically
  }

  if (newStage === 'qualified') {
    update.qualified_at = data.qualified_at || now;
    if (data.service_type) update.service_type = data.service_type;
  }

  if (newStage === 'quoted') {
    update.quoted_at = data.quoted_at || now;
    if (data.quoted_amount) update.quoted_amount = data.quoted_amount;
  }

  if (newStage === 'closed') {
    update.closed_at = data.closed_at || now;
    update.outcome = data.outcome;
    if (data.outcome === 'won') update.won_amount = data.won_amount;
    if (data.outcome === 'lost') update.lost_reason = data.lost_reason;
    if (data.quoted_amount) update.quoted_amount = data.quoted_amount;
  }

  // 5. Execute
  const { error: updateErr } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId);

  if (updateErr) {
    console.error('[transitionLead] Update error:', updateErr.message);
    return { error: updateErr.message, code: 'UPDATE_FAILED' };
  }

  // DB trigger will auto-log stage_change event
  return { success: true, stage: newStage };
}

// ============================================================================
// EVENT LOGGING
// ============================================================================

/**
 * Log event for audit trail and debugging
 * Never throws - used for observability
 *
 * @param {string} leadId - Lead ID
 * @param {string} eventType - Type of event
 * @param {object} payload - Event data
 */
async function logEvent(leadId, eventType, payload = {}) {
  try {
    await supabase.from('lead_events').insert({
      lead_id: leadId,
      event_type: eventType,
      event_payload: typeof payload === 'object' ? payload : { message: String(payload) }
    });
  } catch (err) {
    console.error('[logEvent] Failed:', err.message);
    // NEVER crash on logging failure
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  normalizeSource,
  findDuplicate,
  createOrMergeLead,
  transitionLead,
  logEvent
};
