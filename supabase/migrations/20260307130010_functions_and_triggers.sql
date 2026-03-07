-- =============================================================================
-- 1. Auto-create profile on signup
-- =============================================================================
-- When a new user is created in auth.users, automatically create a profile
-- with a generated username based on their UUID.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || left(replace(new.id::text, '-', ''), 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 2. Auto-update updated_at timestamp
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_reviews_updated
  before update on public.reviews
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 3. Sync suggestion vote_count + suggester reputation
-- =============================================================================

create or replace function public.handle_suggestion_vote_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_suggestion_id uuid;
  v_suggester_id uuid;
begin
  -- Determine which suggestion was affected.
  if tg_op = 'DELETE' then
    v_suggestion_id := old.suggestion_id;
  else
    v_suggestion_id := new.suggestion_id;
  end if;

  -- Update the denormalized vote count.
  update public.community_suggestions
  set vote_count = (
    select count(*) from public.suggestion_votes where suggestion_id = v_suggestion_id
  )
  where id = v_suggestion_id
  returning suggested_by into v_suggester_id;

  -- Update the suggester's reputation (total votes received across all their suggestions).
  if v_suggester_id is not null then
    update public.profiles
    set reputation = (
      select coalesce(sum(cs.vote_count), 0)
      from public.community_suggestions cs
      where cs.suggested_by = v_suggester_id
    )
    where id = v_suggester_id;
  end if;

  return null;
end;
$$;

create trigger on_suggestion_vote_inserted
  after insert on public.suggestion_votes
  for each row execute function public.handle_suggestion_vote_change();

create trigger on_suggestion_vote_deleted
  after delete on public.suggestion_votes
  for each row execute function public.handle_suggestion_vote_change();

-- =============================================================================
-- 4. Sync review helpful_count
-- =============================================================================

create or replace function public.handle_review_vote_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_review_id uuid;
begin
  if tg_op = 'DELETE' then
    v_review_id := old.review_id;
  else
    v_review_id := new.review_id;
  end if;

  update public.reviews
  set helpful_count = (
    select count(*) from public.review_votes where review_id = v_review_id
  )
  where id = v_review_id;

  return null;
end;
$$;

create trigger on_review_vote_inserted
  after insert on public.review_votes
  for each row execute function public.handle_review_vote_change();

create trigger on_review_vote_deleted
  after delete on public.review_votes
  for each row execute function public.handle_review_vote_change();
