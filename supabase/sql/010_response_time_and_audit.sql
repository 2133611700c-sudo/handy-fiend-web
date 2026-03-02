-- Response time calculation and event audit logging
-- Triggers fire automatically on INSERT/UPDATE of leads
-- Never raises exceptions - only logs successful transitions
-- Safe to run multiple times - drops and recreates

-- === RESPONSE TIME TRIGGER ===
-- Auto-calculates response_time_min when contacted_at is set
-- Measures time from lead creation to first contact

CREATE OR REPLACE FUNCTION calc_response_time()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: if contacted_at provided at creation
  IF TG_OP = 'INSERT' AND NEW.contacted_at IS NOT NULL THEN
    NEW.response_time_min := GREATEST(0,
      EXTRACT(EPOCH FROM (NEW.contacted_at - NEW.created_at)) / 60
    )::INTEGER;
  END IF;

  -- UPDATE: first time contacted_at is set
  IF TG_OP = 'UPDATE'
     AND NEW.contacted_at IS NOT NULL
     AND OLD.contacted_at IS NULL THEN
    NEW.response_time_min := GREATEST(0,
      EXTRACT(EPOCH FROM (NEW.contacted_at - NEW.created_at)) / 60
    )::INTEGER;
  END IF;

  -- Always update the updated_at timestamp
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_response_time ON leads;
CREATE TRIGGER trg_response_time
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION calc_response_time();

-- === EVENT AUDIT TRIGGER ===
-- Logs stage transitions and outcome changes to lead_events
-- Runs AFTER the lead row is updated (for read-after-write consistency)
-- Never raises exceptions - only logs successful changes

CREATE OR REPLACE FUNCTION audit_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log stage transitions
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO lead_events (lead_id, event_type, event_payload)
    VALUES (NEW.id, 'stage_change', jsonb_build_object(
      'old_stage', OLD.stage,
      'new_stage', NEW.stage,
      'timestamp', NOW()
    ));
  END IF;

  -- Log outcome changes
  IF OLD.outcome IS DISTINCT FROM NEW.outcome AND NEW.outcome IS NOT NULL THEN
    INSERT INTO lead_events (lead_id, event_type, event_payload)
    VALUES (NEW.id, 'outcome_set', jsonb_build_object(
      'outcome', NEW.outcome,
      'lost_reason', NEW.lost_reason,
      'won_amount', NEW.won_amount,
      'quoted_amount', NEW.quoted_amount,
      'timestamp', NOW()
    ));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_stage ON leads;
CREATE TRIGGER trg_audit_stage
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION audit_stage_change();

-- === SMOKE TESTS ===

-- Test 1: Insert a lead and verify response_time_min is calculated
-- (Comment out or remove after testing)
-- INSERT INTO leads (
--   id, full_name, phone, service_type, created_at, contacted_at
-- ) VALUES (
--   'test_' || floor(random()*1000000)::text,
--   'Test Lead',
--   '555-0123',
--   'Test Service',
--   NOW() - INTERVAL '25 minutes',
--   NOW()
-- ) RETURNING id, created_at, contacted_at, response_time_min;

-- Test 2: Verify constraints work
-- (Uncomment to test - should fail with invalid stage)
-- INSERT INTO leads (id, full_name, stage) VALUES ('invalid_stage_test', 'Test', 'invalid_stage');

-- Test 3: Check event logging works
-- SELECT event_type, event_payload FROM lead_events ORDER BY created_at DESC LIMIT 5;
