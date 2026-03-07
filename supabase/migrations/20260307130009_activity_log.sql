-- Activity log powering "Trending on Kristin."
-- Tracks views, suggestions, votes, reviews, and list additions.
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  tmdb_id     integer not null,
  media_type  public.media_type_enum not null,
  action      text not null,
  created_at  timestamptz not null default now()
);

-- Primary query: aggregate activity per media in a time window.
create index idx_activity_log_trending on public.activity_log (created_at desc, tmdb_id, media_type);

alter table public.activity_log enable row level security;

-- Activity log is write-only for users, read-only for service role.
create policy "Authenticated users can log activity"
  on public.activity_log for insert
  to authenticated
  with check (auth.uid() = user_id);
