-- Sync patch for existing projects where `public.leads` is missing newer columns.
-- Safe to run multiple times (additive only).
-- Run AFTER 001_leads_core.sql.

alter table public.leads
  add column if not exists ai_summary_short text,
  add column if not exists ai_summary_full text,
  add column if not exists assigned_to text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_contact_at timestamptz,
  add column if not exists source_details jsonb not null default '{}'::jsonb;

-- Keep default for lead score if legacy table was missing it.
alter table public.leads
  alter column lead_score set default 0;

-- Backfill null source_details values created before this patch.
update public.leads
set source_details = '{}'::jsonb
where source_details is null;

