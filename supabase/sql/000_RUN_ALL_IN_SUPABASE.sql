-- ============================================================
-- HANDY & FRIEND — ПОВНИЙ SQL ДЛЯ SUPABASE
-- Відкрий: Dashboard → SQL Editor → New Query
-- Встав весь цей файл → натисни Run
-- ============================================================

-- Розширення
create extension if not exists pgcrypto;

-- ============================================================
-- ТАБЛИЦІ
-- ============================================================

create table if not exists public.leads (
  id                  text primary key,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  source              text not null default 'website_chat',
  status              text not null default 'new'
    check (status in ('new','contacted','quoted','booked','completed','lost','partial','spam')),
  full_name           text not null,
  phone               text,
  email               text,
  address             text,
  city                text,
  zip                 text,
  service_type        text,
  problem_description text,
  budget_range        text,
  preferred_date      text,
  lead_score          int not null default 0,
  ai_summary          text,
  notes               text,
  source_details      jsonb not null default '{}'::jsonb
);

create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_source_idx      on public.leads (source);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);
create index if not exists leads_phone_idx       on public.leads (phone);
create index if not exists leads_service_type_idx on public.leads (service_type);
create index if not exists leads_zip_idx         on public.leads (zip);

-- ----

create table if not exists public.lead_photos (
  id          uuid primary key default gen_random_uuid(),
  lead_id     text not null references public.leads(id) on delete cascade,
  created_at  timestamptz not null default now(),
  file_path   text not null,
  file_name   text not null,
  mime_type   text not null,
  file_size   bigint not null default 0,
  ai_tag      text
);

create index if not exists lead_photos_lead_id_idx on public.lead_photos (lead_id);

-- ----

create table if not exists public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  lead_id      text references public.leads(id) on delete cascade,  -- nullable!
  created_at   timestamptz not null default now(),
  session_id   text,
  message_role text not null check (message_role in ('system','assistant','user')),
  message_text text not null,
  tokens_used  int not null default 0
);

create index if not exists ai_conversations_lead_id_idx   on public.ai_conversations (lead_id);
create index if not exists ai_conversations_session_id_idx on public.ai_conversations (session_id);
create index if not exists ai_conversations_created_at_idx on public.ai_conversations (created_at desc);

-- ----

create table if not exists public.lead_events (
  id            uuid primary key default gen_random_uuid(),
  lead_id       text references public.leads(id) on delete cascade,
  created_at    timestamptz not null default now(),
  event_type    text not null,
  event_payload jsonb not null default '{}'::jsonb
);

create index if not exists lead_events_lead_id_idx    on public.lead_events (lead_id);
create index if not exists lead_events_type_idx       on public.lead_events (event_type);
create index if not exists lead_events_created_at_idx on public.lead_events (created_at desc);

-- ============================================================
-- ТРИГЕР: auto updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_on_leads on public.leads;
create trigger set_updated_at_on_leads
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-photos',
  'lead-photos',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.leads              enable row level security;
alter table public.lead_photos        enable row level security;
alter table public.ai_conversations   enable row level security;
alter table public.lead_events        enable row level security;

-- Видалити старі policy якщо є
drop policy if exists leads_anon_read              on public.leads;
drop policy if exists leads_anon_insert            on public.leads;
drop policy if exists lead_photos_anon_read        on public.lead_photos;
drop policy if exists lead_photos_anon_insert      on public.lead_photos;
drop policy if exists ai_conversations_anon_read   on public.ai_conversations;
drop policy if exists ai_conversations_anon_insert on public.ai_conversations;
drop policy if exists "ai_conversations anon insert" on public.ai_conversations;
drop policy if exists "ai_conversations anon session read" on public.ai_conversations;
drop policy if exists lead_events_anon_read        on public.lead_events;
drop policy if exists lead_events_anon_insert      on public.lead_events;

-- ai_conversations: anon може INSERT (чат до ліда) і читати свою сесію
create policy "ai_conv anon insert"
  on public.ai_conversations for insert to anon with check (true);

create policy "ai_conv anon select own session"
  on public.ai_conversations for select to anon
  using (session_id = coalesce(
    current_setting('request.headers', true)::json->>'x-session-id', ''
  ));

-- Storage: тільки service_role
drop policy if exists "lead-photos service role read"   on storage.objects;
drop policy if exists "lead-photos service role insert" on storage.objects;
drop policy if exists "lead-photos service role update" on storage.objects;
drop policy if exists "lead-photos service role delete" on storage.objects;

create policy "lead-photos service role read"
  on storage.objects for select to authenticated
  using (bucket_id = 'lead-photos' and auth.role() = 'service_role');

create policy "lead-photos service role insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lead-photos' and auth.role() = 'service_role');

create policy "lead-photos service role update"
  on storage.objects for update to authenticated
  using (bucket_id = 'lead-photos' and auth.role() = 'service_role')
  with check (bucket_id = 'lead-photos' and auth.role() = 'service_role');

create policy "lead-photos service role delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lead-photos' and auth.role() = 'service_role');

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

create or replace view public.v_lead_funnel as
select status, count(*)::bigint as lead_count
from public.leads group by status;

create or replace view public.v_top_services as
select coalesce(nullif(service_type,''),'unknown') as service_type,
       count(*)::bigint as lead_count
from public.leads group by 1 order by lead_count desc;

create or replace view public.v_top_zips as
select coalesce(nullif(zip,''),'unknown') as zip,
       count(*)::bigint as lead_count
from public.leads group by 1 order by lead_count desc;

-- ============================================================
-- ТЕСТ — запусти після виконання, має повернути 0 рядків
-- ============================================================
-- select count(*) from public.leads;
-- select count(*) from public.ai_conversations;
