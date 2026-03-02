-- Add comprehensive constraints to ensure data integrity
-- Uses NOT VALID pattern to allow existing data to remain
-- Then VALIDATE to add constraint enforcement going forward
-- Safe to run multiple times - drops old constraints first

-- Drop old constraints if they exist (idempotent)
DO $$ BEGIN
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_stage;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_outcome;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_lost_reason;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_won_requires_quote;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_contacted;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_closed;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_source;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Stage constraint: valid pipeline stages
ALTER TABLE leads ADD CONSTRAINT chk_stage
  CHECK (stage IN ('new','contacted','qualified','quoted','closed'))
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_stage;

-- Outcome constraint: only set when closed
ALTER TABLE leads ADD CONSTRAINT chk_outcome
  CHECK (
    (stage != 'closed' AND outcome IS NULL)
    OR (stage = 'closed' AND outcome IN ('won','lost'))
  ) NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_outcome;

-- Lost reason constraint: required when outcome='lost'
ALTER TABLE leads ADD CONSTRAINT chk_lost_reason
  CHECK (outcome IS DISTINCT FROM 'lost'
    OR lost_reason IN ('L1','L2','L3','L4','L5','L6'))
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_lost_reason;

-- Won constraint: won outcome requires both quoted and won amounts
ALTER TABLE leads ADD CONSTRAINT chk_won_requires_quote
  CHECK (outcome IS DISTINCT FROM 'won'
    OR (quoted_amount > 0 AND won_amount > 0))
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_won_requires_quote;

-- Contacted constraint: leads past 'new' stage must have contacted_at
ALTER TABLE leads ADD CONSTRAINT chk_contacted
  CHECK (stage = 'new' OR contacted_at IS NOT NULL)
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_contacted;

-- Closed constraint: closed leads must have closed_at timestamp
ALTER TABLE leads ADD CONSTRAINT chk_closed
  CHECK (stage != 'closed' OR closed_at IS NOT NULL)
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_closed;

-- Source constraint: known channels only (includes legacy values for backward compat)
ALTER TABLE leads ADD CONSTRAINT chk_source
  CHECK (source IS NULL OR source IN (
    'website_chat','website_form','exit_intent','calculator',
    'facebook','instagram','whatsapp','phone','referral',
    'nextdoor','google_business','yelp',
    'direct','ai_chat',
    'other'
  )) NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT chk_source;

-- Test: Try to insert invalid stage (should fail after constraint validation)
-- SELECT COUNT(*) FROM (
--   SELECT 1 WHERE FALSE
--   UNION ALL
--   SELECT 1 FROM leads WHERE stage NOT IN ('new','contacted','qualified','quoted','closed')
-- ) AS invalid_data;
