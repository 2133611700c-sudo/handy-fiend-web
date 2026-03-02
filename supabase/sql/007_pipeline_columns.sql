-- Pipeline enhancement columns for Handy & Friend
-- Adds stage, outcome tracking, timestamps, and response metrics
-- Safe to run multiple times - uses ADD IF NOT EXISTS pattern
-- Execute in Supabase SQL editor as project owner

-- Add pipeline stage column (maps to existing 'status' for transition logic)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='stage') THEN
    ALTER TABLE leads ADD COLUMN stage TEXT DEFAULT 'new';
  END IF;
END $$;

-- Add outcome tracking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='outcome') THEN
    ALTER TABLE leads ADD COLUMN outcome TEXT;
  END IF;
END $$;

-- Add lost reason tracking (L1-L6)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='lost_reason') THEN
    ALTER TABLE leads ADD COLUMN lost_reason TEXT;
  END IF;
END $$;

-- Add pipeline timestamp: when lead first contacted
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='contacted_at') THEN
    ALTER TABLE leads ADD COLUMN contacted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add pipeline timestamp: when lead qualified
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='qualified_at') THEN
    ALTER TABLE leads ADD COLUMN qualified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add pipeline timestamp: when quote sent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='quoted_at') THEN
    ALTER TABLE leads ADD COLUMN quoted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add pipeline timestamp: when deal closed (won or lost)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='closed_at') THEN
    ALTER TABLE leads ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add financial tracking: quote amount
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='quoted_amount') THEN
    ALTER TABLE leads ADD COLUMN quoted_amount NUMERIC(12,2);
  END IF;
END $$;

-- Add financial tracking: won amount
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='won_amount') THEN
    ALTER TABLE leads ADD COLUMN won_amount NUMERIC(12,2);
  END IF;
END $$;

-- Add SLA tracking: auto-calculated response time in minutes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='response_time_min') THEN
    ALTER TABLE leads ADD COLUMN response_time_min INTEGER;
  END IF;
END $$;

-- Add channel tracking for multi-channel support
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='channel') THEN
    ALTER TABLE leads ADD COLUMN channel TEXT;
  END IF;
END $$;

-- Add session ID for AI chat deduplication
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='session_id') THEN
    ALTER TABLE leads ADD COLUMN session_id TEXT;
  END IF;
END $$;

-- Add/ensure updated_at is present (should be from 001_leads_core.sql)
-- This is safe to re-run even if it exists
ALTER TABLE leads
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add indexes for new columns for fast queries
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_outcome_idx ON leads(outcome);
CREATE INDEX IF NOT EXISTS leads_session_id_idx ON leads(session_id);
CREATE INDEX IF NOT EXISTS leads_channel_idx ON leads(channel);
CREATE INDEX IF NOT EXISTS leads_contacted_at_idx ON leads(contacted_at DESC);
CREATE INDEX IF NOT EXISTS leads_closed_at_idx ON leads(closed_at DESC);

-- Smoke test query to verify all columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name='leads' AND column_name IN (
  'stage','outcome','lost_reason','contacted_at','qualified_at',
  'quoted_at','closed_at','quoted_amount','won_amount','response_time_min',
  'channel','session_id'
) ORDER BY column_name;
