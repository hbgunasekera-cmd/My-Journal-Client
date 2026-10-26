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
  if not exists (
    select 1
    from pg_constraint
    where conname = 'error_logs_reporter_client'
      and conrelid = 'public.error_logs'::regclass
  ) then
    alter table public.error_logs
      add constraint error_logs_reporter_client check (reporter = 'Client');
  end if;
end;
$$;

-- Remove equivalent indexes/policy names from the previous table name if it
-- was renamed in Supabase before this migration is applied.
drop index if exists public.idx_client_error_logs_created_at;
drop index if exists public.idx_client_error_logs_error_type_created_at;
drop index if exists public.idx_client_error_logs_page_path_created_at;

create index if not exists idx_error_logs_created_at
  on public.error_logs (created_at desc);

create index if not exists idx_error_logs_error_type_created_at
  on public.error_logs (error_type, created_at desc);

create index if not exists idx_error_logs_page_path_created_at
  on public.error_logs (page_path, created_at desc);

alter table public.error_logs enable row level security;

revoke all on table public.error_logs from anon, authenticated;
grant insert on table public.error_logs to anon, authenticated;

drop policy if exists "Allow public client error inserts"
  on public.error_logs;
drop policy if exists "Allow public error log inserts"
  on public.error_logs;

create policy "Allow public error log inserts"
  on public.error_logs
  for insert
  to anon, authenticated
  with check (
    char_length(message) between 1 and 4000
    and char_length(error_type) <= 80
    and reporter = 'Client'
    and jsonb_typeof(context) = 'object'
  );
