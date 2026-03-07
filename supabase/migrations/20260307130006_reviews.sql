-- User reviews with star ratings (1-10 scale, displayed as 5 stars with halves).
-- One review per user per media.
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  tmdb_id       integer not null,
  media_type    public.media_type_enum not null,
  rating        smallint not null check (rating >= 1 and rating <= 10),
  title         text,
  body          text,
  helpful_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint uq_user_review unique (user_id, tmdb_id, media_type)
);

-- Primary query: "get all reviews for this media, sorted by helpfulness."
create index idx_reviews_media on public.reviews (tmdb_id, media_type, helpful_count desc);

-- Lookup reviews by user (for profile pages).
create index idx_reviews_by_user on public.reviews (user_id);

alter table public.reviews enable row level security;

create policy "Reviews are publicly readable"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);
