-- Server-side cache for TMDB API responses.
-- No RLS — only accessed by the service role key from server code.
create table public.media_cache (
  id          uuid primary key default gen_random_uuid(),
  cache_key   text unique not null,
  data        jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Lookup by cache key (the primary access pattern).
create index idx_media_cache_key on public.media_cache (cache_key);

-- Find expired entries for cleanup.
create index idx_media_cache_expires on public.media_cache (expires_at);

alter table public.media_cache enable row level security;

-- No policies = no access via anon/authenticated keys.
-- Only the service role key (which bypasses RLS) can read/write this table.
