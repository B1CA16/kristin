-- "Was this review helpful?" votes. Same pattern as suggestion votes.
create table public.review_votes (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint uq_review_vote unique (review_id, user_id)
);

create index idx_review_votes_user on public.review_votes (user_id);

alter table public.review_votes enable row level security;

create policy "Review votes are publicly readable"
  on public.review_votes for select
  using (true);

create policy "Authenticated users can vote on reviews"
  on public.review_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their review vote"
  on public.review_votes for delete
  to authenticated
  using (auth.uid() = user_id);
