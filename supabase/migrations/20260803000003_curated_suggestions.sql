-- Distinguishes user-authored suggestions from TMDB-derived seed content.
-- Seeded rows exist so a first-time visitor does not land on an empty page;
-- they must never be presentable as the work of a real user.
create type public.suggestion_source as enum ('community', 'curated');

alter table public.community_suggestions
  add column source       public.suggestion_source not null default 'community',
  add column curated_rank integer,
  alter column suggested_by drop not null,
  -- The two row shapes are mutually exclusive: a curated row cannot have an
  -- owner, a community row cannot lack one. This is the structural guarantee
  -- that seeded content cannot drift into looking user-authored.
  add constraint chk_suggestion_attribution check (
    (source = 'community' and suggested_by is not null and curated_rank is null)
    or
    (source = 'curated'  and suggested_by is null     and curated_rank is not null)
  );

-- Curated rows are ordered by rank, not votes. Partial index: community reads
-- already have idx_suggestions_source.
create index idx_suggestions_curated
  on public.community_suggestions (source_tmdb_id, source_type, curated_rank)
  where source = 'curated';

-- A real suggestion supersedes the curated placeholder for the same pair.
--
-- Without this, uq_suggestion_pair would tell a user their suggestion "already
-- exists" for a pair no human created. Deleting the placeholder keeps one row
-- per pair, leaves the unique constraint untouched, and stops the placeholder's
-- curated_rank being inherited by real content.
--
-- Both directions are deleted: createSuggestion rejects B→A when A→B exists, so
-- a curated reverse row would otherwise block a user permanently.
--
-- security definer is REQUIRED, not stylistic. Under security invoker this runs
-- as `authenticated`, which the delete policy forbids for curated rows — and a
-- DELETE filtered by RLS removes zero rows WITHOUT raising an error. The insert
-- would then hit uq_suggestion_pair and the user would see "already exists"
-- with no way to ever endorse anything.
create or replace function public.supersede_curated_suggestion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'community' then
    delete from public.community_suggestions
     where source = 'curated'
       and (
         (source_tmdb_id = new.source_tmdb_id and source_type = new.source_type
          and target_tmdb_id = new.target_tmdb_id and target_type = new.target_type)
         or
         (source_tmdb_id = new.target_tmdb_id and source_type = new.target_type
          and target_tmdb_id = new.source_tmdb_id and target_type = new.source_type)
       );
  end if;
  return new;
end;
$$;

create trigger on_community_suggestion_supersedes_curated
  before insert on public.community_suggestions
  for each row execute function public.supersede_curated_suggestion();

comment on column public.community_suggestions.source is
  'community = user-authored; curated = TMDB-derived seed content, never attributed to a user.';
comment on column public.community_suggestions.curated_rank is
  'Ordering for curated rows only. Never a vote count.';
