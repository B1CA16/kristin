-- Keep-alive heartbeat.
--
-- Supabase pauses Free-plan projects after 7 consecutive days with no database
-- requests. This table plus ping_keepalive() give external schedulers a cheap,
-- side-effect-free write to issue every few days so the pause timer never
-- reaches zero.
--
-- The table is a singleton by construction: `id` is the primary key and is
-- constrained to 1, so no caller can grow it. That is deliberate — media_cache
-- taught us that a table which grows needs a second job to prune it, and that
-- job can fail silently.
create table public.keepalive (
  id         smallint    primary key default 1,
  last_ping  timestamptz not null default now(),
  ping_count bigint      not null default 0,
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1);

alter table public.keepalive enable row level security;
-- No policies, by design. The table is unreachable through the REST API;
-- ping_keepalive() below is the only door, and the service role (which bypasses
-- RLS) can still read it directly for verification.

-- Bump the heartbeat. Returns the new timestamp so callers can assert the write
-- actually landed rather than trusting a 200 response.
--
-- security definer so the caller does not need to satisfy RLS on keepalive, and
-- therefore does not need the service role key. `set search_path = ''` is what
-- makes that safe: without it, a caller able to create objects could shadow
-- `keepalive` with their own table and have this elevated function write to it.
-- Every reference below is schema-qualified for the same reason.
create or replace function public.ping_keepalive()
returns timestamptz
language sql
security definer
set search_path = ''
as $$
  update public.keepalive
     set last_ping  = now(),
         ping_count = ping_count + 1
   where id = 1
  returning last_ping;
$$;

-- Postgres grants EXECUTE to PUBLIC on new functions by default; revoke that
-- and grant explicitly so the exposed surface is intentional.
revoke all on function public.ping_keepalive() from public;

-- anon can execute it. The anon key is already public (it ships in the client
-- bundle as NEXT_PUBLIC_SUPABASE_ANON_KEY), so schedulers need no secret at
-- all, and the service role key never leaves our control. The blast radius of
-- abuse is one integer on one row.
grant execute on function public.ping_keepalive() to anon, service_role;

comment on table public.keepalive is
  'Singleton heartbeat row. Written by external schedulers to prevent Supabase Free-plan project pausing.';
comment on function public.ping_keepalive() is
  'Bumps the keepalive heartbeat and returns the new timestamp. Executable by anon so schedulers need no secret.';
