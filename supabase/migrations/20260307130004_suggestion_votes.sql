-- Votes on community suggestions. One vote per user per suggestion.
create table public.suggestion_votes (
  id            uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.community_suggestions (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),

  constraint uq_suggestion_vote unique (suggestion_id, user_id)
);

-- Lookup all votes by a user (to show which suggestions they've upvoted).
create index idx_suggestion_votes_user on public.suggestion_votes (user_id);

alter table public.suggestion_votes enable row level security;

create policy "Votes are publicly readable"
  on public.suggestion_votes for select
  using (true);

create policy "Authenticated users can vote"
  on public.suggestion_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own vote"
  on public.suggestion_votes for delete
  to authenticated
  using (auth.uid() = user_id);
