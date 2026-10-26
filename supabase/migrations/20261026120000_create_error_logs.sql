create table if not exists public.error_logs (
  id uuid primary key not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter text not null default 'Client',
  session_id text null,
  error_type text not null,
  error_name text not null,
  message text not null,
  error_code text null,
  source text null,
  page_path text null,
  line_number integer null,
  column_number integer null,
  user_agent text null,
  is_webdriver boolean not null default false,
  stack text null,
  component_stack text null,
  context jsonb not null default '{}'::jsonb,
  constraint error_logs_message_length check (char_length(message) between 1 and 4000),
  constraint error_logs_error_type_length check (char_length(error_type) <= 80),
  constraint error_logs_reporter_client check (reporter = 'Client'),
  constraint error_logs_context_object check (jsonb_typeof(context) = 'object')
);

alter table public.error_logs
  add column if not exists reporter text not null default 'Client';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.error_logs'::regclass
      and conname = 'client_error_logs_pkey'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.error_logs'::regclass
      and conname = 'error_logs_pkey'
  ) then
    alter table public.error_logs
      rename constraint client_error_logs_pkey to error_logs_pkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'error_logs_reporter_client'
      and conrelid = 'public.error_logs'::regclass
  ) then
    alter table public.error_logs
      add constraint error_logs_reporter_client check (reporter = 'Client');
  end if;

  if to_regclass('public.idx_client_error_logs_created_at') is not null
     and to_regclass('public.idx_error_logs_created_at') is null then
    alter index public.idx_client_error_logs_created_at
      rename to idx_error_logs_created_at;
  end if;

  if to_regclass('public.idx_client_error_logs_error_type_created_at') is not null
     and to_regclass('public.idx_error_logs_error_type_created_at') is null then
    alter index public.idx_client_error_logs_error_type_created_at
      rename to idx_error_logs_error_type_created_at;
  end if;

  if to_regclass('public.idx_client_error_logs_page_path_created_at') is not null
     and to_regclass('public.idx_error_logs_page_path_created_at') is null then
    alter index public.idx_client_error_logs_page_path_created_at
      rename to idx_error_logs_page_path_created_at;
  end if;
end;
$$;

create index if not exists idx_error_logs_created_at
  on public.error_logs (created_at desc);

create index if not exists idx_error_logs_error_type_created_at
  on public.error_logs (error_type, created_at desc);

create index if not exists idx_error_logs_page_path_created_at
  on public.error_logs (page_path, created_at desc);

alter table public.error_logs enable row level security;

drop policy if exists "Full Access" on public.error_logs;
drop policy if exists "Policy with security definer functions" on public.error_logs;
drop policy if exists "Public full access" on public.error_logs;
drop policy if exists "Allow public client error inserts" on public.error_logs;
drop policy if exists "Allow public error log inserts" on public.error_logs;

grant all privileges on table public.error_logs to public;

create policy "Public full access"
  on public.error_logs
  for all
  to public
  using (true)
  with check (true);
