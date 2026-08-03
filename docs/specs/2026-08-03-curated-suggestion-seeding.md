# Curated suggestion seeding

**Status:** approved, not yet implemented
**Date:** 2026-08-03

## Problem

The community suggestion system is the product's differentiator, and it is empty.
With zero users, a visitor's first media page shows no suggestions, no trending
activity, and no reason to come back or contribute. The cold-start problem is
self-reinforcing: nobody contributes because it looks abandoned, and it looks
abandoned because nobody contributed.

## Goals

- A first-time visitor sees populated suggestions on popular media.
- Seeded content is **never** presented as the work of real users.
- Seeded content is removable in one command, and displaces itself automatically
  as real contributions arrive.
- No scraping, no fabricated prose, no fake accounts.

## Non-goals

- **Reviews and ratings stay empty.** Review prose cannot be legitimately
  sourced, and star ratings attributed to people who do not exist are simply
  fake. There is no honest labelling for either.
- **No fabricated `activity_log` rows.** See "Trending" below.
- Bringing traffic. Seeding stops the first visitor bouncing; it does not attract
  them.

## Data source

TMDB `/recommendations` and `/similar`, which we already consume through
`src/lib/tmdb/client.ts` with an API key we already hold. This data is itself
crowd-derived, which is exactly the relation we want to display. Scraping
Letterboxd, Reddit, or TasteDive would add ToS exposure, copyright risk on any
lifted prose, and a scraper to maintain, in exchange for nothing TMDB does not
already give us.

Open question to resolve separately: TMDB's terms treat commercial use
differently, and the site serves AdSense. Worth confirming before launch — the
same category of problem as Vercel's fair-use rule.

## Schema

Migration: `supabase/migrations/20260803000003_curated_suggestions.sql`

```sql
create type public.suggestion_source as enum ('community', 'curated');

alter table public.community_suggestions
  add column source       public.suggestion_source not null default 'community',
  add column curated_rank integer,
  alter column suggested_by drop not null,
  add constraint chk_suggestion_attribution check (
    (source = 'community' and suggested_by is not null and curated_rank is null)
    or
    (source = 'curated'  and suggested_by is null     and curated_rank is not null)
  );

create index idx_suggestions_curated
  on public.community_suggestions (source_tmdb_id, source_type, curated_rank)
  where source = 'curated';
```

`chk_suggestion_attribution` makes the two row shapes mutually exclusive: a
curated row cannot have an owner, and a community row cannot lack one. This is
the structural guarantee that seeded content can never drift into looking
user-authored.

### RLS requires no changes

The existing policies already produce the behaviour we want, because
`suggested_by` is null on curated rows:

- Insert: `with check (auth.uid() = suggested_by)` — never true for null, so no
  user can forge a curated row.
- Delete: `using (auth.uid() = suggested_by)` — so no user can delete one.
- Select: `using (true)` — curated rows are publicly readable.

Only the service role writes curated data. No policy edits needed.

### `vote_count` is not seeded

`vote_count` is maintained by `handle_suggestion_vote_change()` as
`count(*) from suggestion_votes`. Writing a fake value would be recalculated to
the true count the moment anyone voted — a curated row showing 340 would drop to
1 in front of the user. It is a self-destructing lie.

Ordering of curated rows therefore uses `curated_rank`, derived from TMDB
ordering/popularity at seed time, and curated cards render **no vote badge**. If
a number is ever shown, it must be labelled as TMDB popularity, not votes.

Note `handle_suggestion_vote_change()` already guards `if v_suggester_id is not
null`, so a null `suggested_by` cannot break the reputation sync. No change
needed there.

## Community suggestions supersede curated ones

`uq_suggestion_pair` is unique on the directional pair. A curated A→B would
otherwise block a real user from suggesting A→B — they would be told it already
exists for a pair no human created.

A `before insert` trigger on `community_suggestions` deletes any curated row for
the same pair when a community row arrives. One row per pair always, the unique
constraint stays untouched, and the curated row's rank is not inherited.

**The trigger function must be `security definer` with `set search_path = ''`.**
This is not stylistic. A `security invoker` function runs as `authenticated`,
which the delete policy forbids for curated rows — and a DELETE blocked by RLS
removes zero rows _without raising an error_. The insert would then hit the
unique constraint, and the user would see "this suggestion already exists" with
no way to ever endorse it. Silent RLS filtering turning into a confusing
downstream error is the failure mode to avoid here. `security definer` matches
the convention already used by `handle_new_user()` and
`handle_suggestion_vote_change()`.

Trade-off accepted: an INSERT with a DELETE side effect is surprising, so it
needs an explicit comment. The alternative — widening the unique key to include
`source` and de-duplicating in every read — spreads the rule across every query
instead of stating it once.

## Endorsement

Curated suggestions are not votable. Voting would attach real votes to
author-less rows and muddy the distinction the schema just established. Instead a
user can adopt one.

New server action, `endorseCuratedSuggestion(suggestionId)` in
`src/actions/suggestions.ts`:

1. Require an authenticated user.
2. Load the row; verify `source = 'curated'`. Reject otherwise.
3. Apply the same reverse-duplicate check as `createSuggestion` — if a community
   B→A exists, block with the existing message.
4. Insert a community row for the same pair with `suggested_by = user.id`,
   `reason = null`, `source = 'community'`. The trigger removes the placeholder.
5. `logActivity({ action: 'suggestion_created' })` — a real user action, so it
   legitimately feeds trending.
6. `revalidatePath` for the source media page.

Reputation is unaffected at endorsement time: reputation is the sum of
`vote_count` across a user's suggestions, so adopting a suggestion grants zero
until other people vote for it. Endorsement cannot be farmed.

Concurrency: if two users endorse simultaneously, the first insert wins and
deletes the placeholder; the second gets `23505` and is shown "this suggestion
already exists". Acceptable.

**UI honesty requirement:** the user is taking authorship of a pair TMDB
generated, so the affordance must make that explicit — "Suggest this too", with
confirmation making clear it will appear as their suggestion. Not a bare
"Endorse", which hides what is being recorded.

## Trending

`getTrendingOnKristin()` in `src/actions/discover.ts` aggregates `activity_log`
over 7 days and currently returns nothing.

`activity_log` will **not** be seeded. Every other kind of seeded data can be
labelled truthfully, but an activity row asserts _someone did this_ — there is no
honest label for a fabricated view.

Instead: when the aggregate returns **fewer than 5** results, fall back to TMDB
trending, and have the section header reflect which source is being shown. No
seed rows, no cleanup, and it self-heals — real activity displaces the fallback
automatically.

5 rather than 0 deliberately: a single stray activity row should not be enough to
replace a full trending grid with one lonely entry, which would look more broken
than the fallback it replaced.

## Seed script

`scripts/seed-curated.ts`, exposed as `pnpm seed:curated`. Flags: `--dry-run`,
`--limit`, `--purge`.

- Talks to TMDB directly rather than through `src/lib/tmdb/client.ts`, which
  passes `next: { revalidate }` and is built for the Next runtime.
- Uses the service role Supabase client.
- Sources: TMDB popular movies and popular TV, 100 of each = 200 titles.
- For each source, take the top 5 recommendations → up to 1,000 curated rows,
  fewer after reverse-pair skipping. `curated_rank` is the 0-based position
  within that source's recommendation list.
- `--limit` caps the number of source titles, for cheap dry runs.
- `reason` stays null. A templated human-sounding reason would be fabrication;
  the section label carries the provenance instead.

**Idempotency:** upsert with `onConflict` on the pair columns and
`ignoreDuplicates: true`. A plain upsert would **overwrite a real user's
suggestion** whenever a pair collided. Existing rows of either source are left
untouched.

**Removal:** `--purge` deletes `where source = 'curated'`.

### Reverse-pair invariant

`createSuggestion` rejects B→A when A→B exists, but this rule lives only in
application code — the database constraint is directional. TMDB recommendations
are frequently symmetric, so a naive seed would create both directions and then
block real users from suggesting either.

The seed script must therefore replicate the rule: track normalised pairs and
skip a recommendation whose reverse is already queued or stored.

Noted as a follow-up: this invariant belongs in the database as a unique index on
a canonical ordering of the two `(type, id)` keys. Doing it properly requires an
expression index over a composed key and is out of scope here.

## UI changes

- `src/components/recommendations/community-suggestions.tsx` — split into a
  community section and a visually distinct curated section below it, with a
  label stating the provenance.
- `src/components/recommendations/suggestion-card.tsx` — support an author-less
  variant: no profile link, no vote control, "Suggest this too" action instead.
- `src/actions/suggestions.ts` — `getSuggestionsFor` embeds
  `profiles!community_suggestions_suggested_by_fkey (username, reputation)`,
  which becomes `null` for curated rows. **The result type and every consumer
  must handle a null author.** This is the main place a runtime bug could hide.
- The existing merge sorts purely by `voteCount`; curated rows are all 0 and
  would land in arbitrary order. Sorting becomes source-aware: community by
  votes, then curated by `curated_rank`.

## Testing

- Unit: seed script pair-normalisation and reverse-skip logic.
- Unit: source-aware sort ordering.
- Integration (blocked): `chk_suggestion_attribution` rejects both invalid
  shapes; the supersede trigger deletes the placeholder and works when invoked as
  `authenticated`; the insert RLS policy rejects a forged curated row. **The repo
  has no database test harness** — `pnpm check` runs `--passWithNoTests`. These
  need local Supabase plus a pgTAP or integration setup, already on the ROADMAP as
  its own item. Until then these are manual checks.
- Manual: endorse a curated suggestion, confirm the placeholder disappears, the
  community row appears under the user's name, and reputation stays 0.

## Rollback

`pnpm seed:curated --purge` removes all seeded content. The schema additions are
inert once no curated rows exist — `source` defaults to `'community'` and the
CHECK is satisfied by every normal row.
