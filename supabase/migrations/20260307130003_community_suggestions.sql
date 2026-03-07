-- Community suggestions: "if you liked A, you'll like B" pairs.
-- One entry per unique media pair — duplicates are prevented by the unique constraint.
create table public.community_suggestions (
  id              uuid primary key default gen_random_uuid(),
  source_tmdb_id  integer not null,
  source_type     public.media_type_enum not null,
  target_tmdb_id  integer not null,
  target_type     public.media_type_enum not null,
  reason          text,
  suggested_by    uuid not null references public.profiles (id) on delete cascade,
  vote_count      integer not null default 0,
  created_at      timestamptz not null default now(),

  -- Prevent duplicate pairs: only one suggestion for A→B.
  constraint uq_suggestion_pair unique (source_tmdb_id, source_type, target_tmdb_id, target_type),

  -- Prevent self-suggestions: a movie can't be similar to itself.
  constraint chk_not_self_suggestion check (
    source_tmdb_id != target_tmdb_id or source_type != target_type
  )
);

-- Primary query pattern: "get all suggestions for this media, sorted by votes."
create index idx_suggestions_source on public.community_suggestions (source_tmdb_id, source_type, vote_count desc);

-- Lookup suggestions by user (for profile pages).
create index idx_suggestions_by_user on public.community_suggestions (suggested_by);

alter table public.community_suggestions enable row level security;

create policy "Suggestions are publicly readable"
  on public.community_suggestions for select
  using (true);

create policy "Authenticated users can create suggestions"
  on public.community_suggestions for insert
  to authenticated
  with check (auth.uid() = suggested_by);

create policy "Users can delete their own suggestions"
  on public.community_suggestions for delete
  to authenticated
  using (auth.uid() = suggested_by);
