-- Backfill existing data for pipeline columns
-- Maps existing 'status' values to new 'stage' column
-- Ensures no NULL values in required fields
-- Safe to run multiple times

-- Initialize stage from existing status
UPDATE leads
SET stage = CASE
  WHEN status IN ('new', 'contacted', 'quoted', 'partial') THEN status
  WHEN status IN ('won', 'lost') THEN 'closed'
  ELSE 'new'
END
WHERE stage IS NULL;

-- Ensure no NULL stages
UPDATE leads SET stage = 'new' WHERE stage IS NULL;

-- Normalize source values - keep legacy values, backfill others
UPDATE leads SET source = 'other' WHERE source IS NULL;

-- Initialize outcome from legacy status field
UPDATE leads
SET outcome = CASE
  WHEN status = 'won' THEN 'won'
  WHEN status = 'lost' THEN 'lost'
  ELSE NULL
END
WHERE outcome IS NULL AND status IN ('won', 'lost');

-- Set closed_at for historically closed deals (won/lost in old status)
UPDATE leads
SET closed_at = last_contact_at
WHERE closed_at IS NULL
  AND status IN ('won', 'lost')
  AND last_contact_at IS NOT NULL;

-- For closed leads without timestamp, use updated_at as fallback
UPDATE leads
SET closed_at = updated_at
WHERE closed_at IS NULL AND stage = 'closed';

-- Set contacted_at for leads that moved past 'new' stage
UPDATE leads
SET contacted_at = created_at
WHERE contacted_at IS NULL AND stage != 'new';

-- Verify data quality
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN stage IS NULL THEN 1 END) as null_stages,
  COUNT(CASE WHEN source IS NULL THEN 1 END) as null_sources,
  COUNT(CASE WHEN stage = 'closed' AND outcome IS NULL THEN 1 END) as closed_missing_outcome
FROM leads;
