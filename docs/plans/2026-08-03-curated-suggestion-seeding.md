# Curated Suggestion Seeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate empty community suggestion surfaces with TMDB-derived "curated" suggestions that are structurally distinguishable from user content, and let real users adopt them.

**Architecture:** Add a `source` discriminator to `community_suggestions` with a CHECK constraint making curated rows (no author, has rank) and community rows (has author, no rank) mutually exclusive. A `security definer` trigger deletes curated placeholders when a real suggestion for the same pair arrives, so seeded content dismantles itself. A standalone `tsx` script writes curated rows from TMDB recommendations. Trending falls back to TMDB rather than seeding fabricated activity.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase Postgres + RLS, next-intl, Vitest, `tsx` for the script runner.

## Global Constraints

- TypeScript strict mode. No `any` unless unavoidable.
- Named exports except Next.js pages and `next/image` loader files.
- All user-facing strings via next-intl. Keys added to **all four** of `src/messages/{en,pt,es,fr}.json`.
- Server Components by default; `"use client"` only for interactivity.
- Zod for input validation on anything user-supplied.
- Test files live in `tests/`, mirroring `src/`. Vitest only collects `tests/**/*.test.{ts,tsx}`.
- Run `pnpm check` before every commit (lint + format:check + typecheck + tests + build).
- Never commit directly — each task ends with a suggested commit for the user to run.
- Curated rows never receive a fabricated `vote_count` and never render a vote badge.
- `reason` is always `null` on curated rows.
- No fabricated `activity_log` rows, ever.

## File Structure

**Created:**

- `supabase/migrations/20260803000003_curated_suggestions.sql` — enum, columns, CHECK, partial index, supersede trigger.
- `src/lib/suggestions/pair.ts` — media-key and undirected-pair-key helpers. Pure, no I/O.
- `src/lib/suggestions/sort.ts` — source-aware comparator. Pure.
- `scripts/seed-curated.ts` — CLI seeding script.
- `tests/lib/suggestions/pair.test.ts`
- `tests/lib/suggestions/sort.test.ts`

**Modified:**

- `src/types/database.ts` — regenerated.
- `src/actions/suggestions.ts` — nullable author on the result type, `source`/`curatedRank` fields, source-aware sort, curated-aware reverse check, new `endorseCuratedSuggestion`.
- `src/actions/discover.ts` — TMDB trending fallback in `getTrendingOnKristin`.
- `src/components/recommendations/community-suggestions.tsx` — split community/curated sections.
- `src/components/recommendations/suggestion-card.tsx` — author-less variant.
- `src/messages/{en,pt,es,fr}.json` — new `suggestions.*` keys.
- `package.json` — `seed:curated` script.

---

### Task 1: Schema — source discriminator and supersede trigger

**Files:**

- Create: `supabase/migrations/20260803000003_curated_suggestions.sql`

**Interfaces:**

- Consumes: nothing.
- Produces: `public.suggestion_source` enum (`'community' | 'curated'`); `community_suggestions.source` (not null, default `'community'`), `community_suggestions.curated_rank` (nullable int); `suggested_by` becomes nullable; trigger `on_community_suggestion_supersedes_curated`.

**Note:** There is no database test harness in this repo (`pnpm check` runs `--passWithNoTests`). Verification for this task is manual SQL, run against the **dev** project. This is a known gap tracked on ROADMAP.

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply to dev**

```powershell
supabase link --project-ref ajsbagjsicmsfzdqvpfw
supabase migration list
supabase db push
```

Expected: only `20260803000003` pending, then applied.

- [ ] **Step 3: Verify the CHECK rejects both invalid shapes**

Run in the dev SQL editor. **Both must fail** with `chk_suggestion_attribution`:

```sql
-- curated row with an owner -> must fail
insert into public.community_suggestions
  (source_tmdb_id, source_type, target_tmdb_id, target_type, source, curated_rank, suggested_by)
values (1, 'movie', 2, 'movie', 'curated', 0, gen_random_uuid());

-- community row without an owner -> must fail
insert into public.community_suggestions
  (source_tmdb_id, source_type, target_tmdb_id, target_type, source)
values (1, 'movie', 2, 'movie', 'community');
```

- [ ] **Step 4: Verify a valid curated row inserts, then the trigger supersedes it**

```sql
insert into public.community_suggestions
  (source_tmdb_id, source_type, target_tmdb_id, target_type, source, curated_rank)
values (550, 'movie', 807, 'movie', 'curated', 0);

-- Insert the reverse direction as community, using any real profile id.
insert into public.community_suggestions
  (source_tmdb_id, source_type, target_tmdb_id, target_type, source, suggested_by)
values (807, 'movie', 550, 'movie', 'community', (select id from public.profiles limit 1));

-- Expect exactly ONE row: the community one. The curated row must be gone,
-- proving reverse-direction superseding works.
select source, source_tmdb_id, target_tmdb_id, suggested_by, curated_rank
from public.community_suggestions
where source_tmdb_id in (550, 807) and target_tmdb_id in (550, 807);

-- Clean up
delete from public.community_suggestions
where source_tmdb_id in (550, 807) and target_tmdb_id in (550, 807);
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260803000003_curated_suggestions.sql
git commit -m "feat(db): add curated suggestion source with supersede trigger"
```

---

### Task 2: Pair-key helpers

**Files:**

- Create: `src/lib/suggestions/pair.ts`
- Test: `tests/lib/suggestions/pair.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type MediaType = 'movie' | 'tv'`
  - `type MediaPair = { sourceTmdbId: number; sourceType: MediaType; targetTmdbId: number; targetType: MediaType }`
  - `mediaKey(mediaType: MediaType, tmdbId: number): string`
  - `undirectedPairKey(pair: MediaPair): string` — identical for A→B and B→A.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/suggestions/pair.test.ts
import { describe, it, expect } from 'vitest';
import { mediaKey, undirectedPairKey } from '@/lib/suggestions/pair';

describe('mediaKey', () => {
  it('namespaces the id by media type', () => {
    expect(mediaKey('movie', 550)).toBe('movie-550');
    expect(mediaKey('tv', 550)).toBe('tv-550');
  });

  it('does not collide across types with the same id', () => {
    expect(mediaKey('movie', 1)).not.toBe(mediaKey('tv', 1));
  });
});

describe('undirectedPairKey', () => {
  it('is identical for both directions', () => {
    const forward = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 807,
      targetType: 'movie',
    });
    const reverse = undirectedPairKey({
      sourceTmdbId: 807,
      sourceType: 'movie',
      targetTmdbId: 550,
      targetType: 'movie',
    });
    expect(forward).toBe(reverse);
  });

  it('distinguishes different pairs', () => {
    const a = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 807,
      targetType: 'movie',
    });
    const b = undirectedPairKey({
      sourceTmdbId: 550,
      sourceType: 'movie',
      targetTmdbId: 808,
      targetType: 'movie',
    });
    expect(a).not.toBe(b);
  });

  it('distinguishes a movie pair from a tv pair with the same ids', () => {
    const movies = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'movie',
      targetTmdbId: 2,
      targetType: 'movie',
    });
    const tv = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'tv',
      targetTmdbId: 2,
      targetType: 'tv',
    });
    expect(movies).not.toBe(tv);
  });

  it('distinguishes mixed-type pairs by which side is which', () => {
    const a = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'movie',
      targetTmdbId: 2,
      targetType: 'tv',
    });
    const b = undirectedPairKey({
      sourceTmdbId: 1,
      sourceType: 'tv',
      targetTmdbId: 2,
      targetType: 'movie',
    });
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/lib/suggestions/pair.test.ts`
Expected: FAIL — cannot resolve `@/lib/suggestions/pair`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/suggestions/pair.ts

/**
 * Media pair identity helpers.
 *
 * A suggestion is stored directionally (source → target), but the app treats
 * A→B and B→A as the same recommendation: `createSuggestion` rejects the reverse
 * of an existing pair, and reads surface both directions. Anything writing
 * suggestions outside the server actions — notably the seed script — must
 * respect that, so the "are these the same pair?" rule lives here rather than
 * being reimplemented per caller.
 */

export type MediaType = 'movie' | 'tv';

export type MediaPair = {
  sourceTmdbId: number;
  sourceType: MediaType;
  targetTmdbId: number;
  targetType: MediaType;
};

/** Type-namespaced media identity. TMDB reuses ids across movies and TV. */
export function mediaKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}-${tmdbId}`;
}

/**
 * Direction-independent key for a pair. Sorting the two media keys means A→B
 * and B→A collapse to the same string, which is what makes reverse-duplicate
 * detection a set lookup.
 */
export function undirectedPairKey(pair: MediaPair): string {
  const a = mediaKey(pair.sourceType, pair.sourceTmdbId);
  const b = mediaKey(pair.targetType, pair.targetTmdbId);
  return [a, b].sort().join('|');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/lib/suggestions/pair.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/suggestions/pair.ts tests/lib/suggestions/pair.test.ts
git commit -m "feat(suggestions): add undirected media pair key helpers"
```

---

### Task 3: Source-aware comparator

**Files:**

- Create: `src/lib/suggestions/sort.ts`
- Test: `tests/lib/suggestions/sort.test.ts`

**Interfaces:**

- Consumes: `MediaType` from `@/lib/suggestions/pair` (not required, but keep types aligned).
- Produces:
  - `type SortableSuggestion = { voteCount: number; source: 'community' | 'curated'; curatedRank: number | null }`
  - `compareSuggestions(a: SortableSuggestion, b: SortableSuggestion): number`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/suggestions/sort.test.ts
import { describe, it, expect } from 'vitest';
import {
  compareSuggestions,
  type SortableSuggestion,
} from '@/lib/suggestions/sort';

const community = (voteCount: number): SortableSuggestion => ({
  voteCount,
  source: 'community',
  curatedRank: null,
});

const curated = (curatedRank: number): SortableSuggestion => ({
  voteCount: 0,
  source: 'curated',
  curatedRank,
});

describe('compareSuggestions', () => {
  it('ranks community above curated regardless of votes', () => {
    // A zero-vote real suggestion still outranks any seeded one.
    expect(compareSuggestions(community(0), curated(0))).toBeLessThan(0);
    expect(compareSuggestions(curated(0), community(0))).toBeGreaterThan(0);
  });

  it('sorts community by vote count descending', () => {
    expect(compareSuggestions(community(5), community(2))).toBeLessThan(0);
    expect(compareSuggestions(community(2), community(5))).toBeGreaterThan(0);
  });

  it('sorts curated by rank ascending', () => {
    expect(compareSuggestions(curated(0), curated(3))).toBeLessThan(0);
    expect(compareSuggestions(curated(3), curated(0))).toBeGreaterThan(0);
  });

  it('produces a stable full ordering when used with sort()', () => {
    const list = [curated(1), community(3), curated(0), community(9)];
    const sorted = [...list].sort(compareSuggestions);
    expect(sorted).toEqual([
      community(9),
      community(3),
      curated(0),
      curated(1),
    ]);
  });

  it('treats a null curatedRank as last rather than as rank 0', () => {
    // Defensive: the CHECK constraint forbids this, but a comparator that
    // silently coerced null to 0 would promote malformed rows to the top.
    const malformed: SortableSuggestion = {
      voteCount: 0,
      source: 'curated',
      curatedRank: null,
    };
    expect(compareSuggestions(curated(5), malformed)).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/lib/suggestions/sort.test.ts`
Expected: FAIL — cannot resolve `@/lib/suggestions/sort`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/suggestions/sort.ts

/**
 * Ordering for the merged suggestion list.
 *
 * Community suggestions always precede curated ones, so a single real
 * contribution is never buried under seeded content. Sorting by vote count
 * alone would not achieve that: curated rows carry no votes by design, so they
 * would interleave with new zero-vote real suggestions.
 */

export type SortableSuggestion = {
  voteCount: number;
  source: 'community' | 'curated';
  curatedRank: number | null;
};

/** Sort last, not first — a missing rank must never win. */
const RANK_LAST = Number.MAX_SAFE_INTEGER;

export function compareSuggestions(
  a: SortableSuggestion,
  b: SortableSuggestion,
): number {
  if (a.source !== b.source) {
    return a.source === 'community' ? -1 : 1;
  }

  if (a.source === 'community') {
    return b.voteCount - a.voteCount;
  }

  return (a.curatedRank ?? RANK_LAST) - (b.curatedRank ?? RANK_LAST);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/lib/suggestions/sort.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/suggestions/sort.ts tests/lib/suggestions/sort.test.ts
git commit -m "feat(suggestions): add source-aware suggestion comparator"
```

---

### Task 4: Regenerate types and widen the suggestion read model

**Files:**

- Modify: `src/types/database.ts` (regenerated)
- Modify: `src/actions/suggestions.ts:10-154`

**Interfaces:**

- Consumes: `compareSuggestions`, `SortableSuggestion` from Task 3.
- Produces: `SuggestionWithVoteStatus` gains `source: 'community' | 'curated'`, `curatedRank: number | null`, and `suggestedBy` / `suggestedByUsername` / `suggestedByReputation` become nullable.

**Why this matters:** the current mapper writes `?? 'unknown'` and `?? 0` for the profile join. Curated rows would therefore render as authored by a user literally named "unknown" — not a crash, which is worse: it looks like a real account with a broken profile. Nullability must be explicit.

- [ ] **Step 1: Regenerate database types**

```powershell
supabase gen types typescript --linked | Out-File -Encoding utf8 src/types/database.ts
pnpm format
```

Expected: `database.ts` gains `source`, `curated_rank`, `suggestion_source`, and `suggested_by` becomes nullable.

- [ ] **Step 2: Update the result type**

In `src/actions/suggestions.ts`, replace the `SuggestionWithVoteStatus` declaration:

```ts
export type SuggestionWithVoteStatus = {
  id: string;
  targetTmdbId: number;
  targetType: 'movie' | 'tv';
  reason: string | null;
  voteCount: number;
  /** Null for curated rows — seeded content has no author by construction. */
  suggestedBy: string | null;
  suggestedByUsername: string | null;
  suggestedByReputation: number | null;
  createdAt: string;
  hasVoted: boolean;
  /** True when this suggestion was created from the other media's page. */
  isReverse: boolean;
  source: 'community' | 'curated';
  /** Ordering hint for curated rows. Never a vote count. */
  curatedRank: number | null;
};
```

- [ ] **Step 3: Select the new columns and map them**

Add `source,` and `curated_rank,` to **both** `.select()` blocks (after `vote_count,`).

Replace the three `?? 'unknown'` / `?? 0` fallbacks in **both** mappers with straight nulls, and add the two new fields. Forward mapper:

```ts
const forwardMapped: SuggestionWithVoteStatus[] = forward.map((s) => ({
  id: s.id,
  targetTmdbId: s.target_tmdb_id,
  targetType: s.target_type,
  reason: s.reason,
  voteCount: s.vote_count,
  suggestedBy: s.suggested_by,
  suggestedByUsername:
    (s.profiles as unknown as ProfileJoin | null)?.username ?? null,
  suggestedByReputation:
    (s.profiles as unknown as ProfileJoin | null)?.reputation ?? null,
  createdAt: s.created_at,
  hasVoted: votedSuggestionIds.has(s.id),
  isReverse: false,
  source: s.source,
  curatedRank: s.curated_rank,
}));
```

Reverse mapper: identical, except `targetTmdbId: s.source_tmdb_id`, `targetType: s.source_type`, and `isReverse: true`.

- [ ] **Step 4: Replace the sort**

Replace:

```ts
const merged = [...forwardMapped, ...reverseMapped].sort(
  (a, b) => b.voteCount - a.voteCount,
);
```

with:

```ts
const merged = [...forwardMapped, ...reverseMapped].sort(compareSuggestions);
```

Add to the imports at the top of the file:

```ts
import { compareSuggestions } from '@/lib/suggestions/sort';
```

- [ ] **Step 5: Make the reverse-duplicate check ignore curated rows**

In `createSuggestion`, the reverse check (around line 189) must not let a curated placeholder block a real user. Add a `source` filter:

```ts
const { data: reverseExists } = await supabase
  .from('community_suggestions')
  .select('id')
  .eq('source_tmdb_id', target.tmdbId)
  .eq('source_type', target.mediaType)
  .eq('target_tmdb_id', source.tmdbId)
  .eq('target_type', source.mediaType)
  .eq('source', 'community')
  .limit(1);
```

The curated reverse row is removed by the Task 1 trigger during the insert, so it needs no check here.

- [ ] **Step 6: Verify the whole suite**

Run: `pnpm check`
Expected: PASS. Typecheck will flag every consumer that assumed a non-null author — fix each by handling null (Task 6 covers the card itself; if a profile page or another consumer breaks, handle it there too).

- [ ] **Step 7: Commit**

```bash
git add src/types/database.ts src/actions/suggestions.ts
git commit -m "feat(suggestions): surface source and nullable author in read model"
```

---

### Task 5: Seed script

**Files:**

- Create: `scripts/seed-curated.ts`
- Modify: `package.json` (scripts)

**Interfaces:**

- Consumes: `undirectedPairKey`, `mediaKey`, `MediaType`, `MediaPair` from Task 2.
- Produces: `pnpm seed:curated [--dry-run] [--purge] [--limit=N]`.

**Design notes:**

- Talks to TMDB with plain `fetch`, not `src/lib/tmdb/client.ts` — that wrapper passes `next: { revalidate }` and is built for the Next runtime.
- Uses the service role key. Curated writes are impossible with the anon key by design (the insert policy requires `auth.uid() = suggested_by`).
- Env comes from `--env-file`, so no `dotenv` dependency.

- [ ] **Step 1: Add the script entry to `package.json`**

```json
"seed:curated": "tsx --env-file=.env.local scripts/seed-curated.ts"
```

- [ ] **Step 2: Write the script**

```ts
// scripts/seed-curated.ts
/**
 * Seeds `community_suggestions` with TMDB-derived curated rows so a first-time
 * visitor does not land on empty pages.
 *
 * Curated rows carry no author and no vote count. They are superseded
 * automatically when a real user suggests the same pair (see the
 * supersede_curated_suggestion trigger), so this is scaffolding that removes
 * itself rather than permanent content.
 *
 * Usage:
 *   pnpm seed:curated                 # seed 100 movies + 100 TV
 *   pnpm seed:curated --dry-run       # print what would be written
 *   pnpm seed:curated --limit=5       # small run for verification
 *   pnpm seed:curated --purge         # delete all curated rows
 */
import { createClient } from '@supabase/supabase-js';
import {
  undirectedPairKey,
  type MediaPair,
  type MediaType,
} from '../src/lib/suggestions/pair';
import type { Database } from '../src/types/database';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const RECOMMENDATIONS_PER_SOURCE = 5;
const DEFAULT_SOURCE_COUNT = 100;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const purge = args.includes('--purge');
const limitArg = args.find((a) => a.startsWith('--limit='));
const sourceCount = limitArg
  ? Number(limitArg.split('=')[1])
  : DEFAULT_SOURCE_COUNT;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const supabase = createClient<Database>(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
);
const tmdbKey = requireEnv('TMDB_API_KEY');

type TmdbListItem = { id: number };
type TmdbListResponse = { results?: TmdbListItem[] };

async function tmdb<T>(path: string, page = 1): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set('api_key', tmdbKey);
  url.searchParams.set('page', String(page));

  // TMDB rate-limits; retry with backoff rather than dropping data silently.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`TMDB ${path} failed: ${res.status}`);
    }
    await new Promise((r) => setTimeout(r, attempt * 1000));
  }
  throw new Error(`TMDB ${path} failed after 3 attempts`);
}

async function collectSources(
  mediaType: MediaType,
  count: number,
): Promise<number[]> {
  const ids: number[] = [];
  const endpoint = mediaType === 'movie' ? '/movie/popular' : '/tv/popular';

  for (let page = 1; ids.length < count && page <= 10; page += 1) {
    const data = await tmdb<TmdbListResponse>(endpoint, page);
    for (const item of data.results ?? []) {
      if (ids.length < count) ids.push(item.id);
    }
  }
  return ids;
}

type CuratedRow = {
  source_tmdb_id: number;
  source_type: MediaType;
  target_tmdb_id: number;
  target_type: MediaType;
  source: 'curated';
  curated_rank: number;
};

async function buildRows(
  mediaType: MediaType,
  sourceIds: number[],
  seenPairs: Set<string>,
): Promise<CuratedRow[]> {
  const rows: CuratedRow[] = [];

  for (const sourceId of sourceIds) {
    const data = await tmdb<TmdbListResponse>(
      `/${mediaType}/${sourceId}/recommendations`,
    );
    let rank = 0;

    for (const rec of data.results ?? []) {
      if (rank >= RECOMMENDATIONS_PER_SOURCE) break;
      if (rec.id === sourceId) continue; // chk_not_self_suggestion

      const pair: MediaPair = {
        sourceTmdbId: sourceId,
        sourceType: mediaType,
        targetTmdbId: rec.id,
        targetType: mediaType,
      };

      // The app treats A→B and B→A as the same recommendation, and
      // createSuggestion rejects the reverse of an existing pair. TMDB
      // recommendations are frequently symmetric, so seeding both directions
      // would permanently block real users from suggesting either.
      const key = undirectedPairKey(pair);
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      rows.push({
        source_tmdb_id: sourceId,
        source_type: mediaType,
        target_tmdb_id: rec.id,
        target_type: mediaType,
        source: 'curated',
        curated_rank: rank,
      });
      rank += 1;
    }
  }

  return rows;
}

async function main(): Promise<void> {
  if (purge) {
    const { error, count } = await supabase
      .from('community_suggestions')
      .delete({ count: 'exact' })
      .eq('source', 'curated');

    if (error) {
      console.error(`Purge failed: ${error.message}`);
      process.exit(1);
    }
    console.log(`Purged ${count ?? 0} curated suggestions.`);
    return;
  }

  const seenPairs = new Set<string>();

  console.log(`Collecting ${sourceCount} popular movies and TV shows...`);
  const movieIds = await collectSources('movie', sourceCount);
  const tvIds = await collectSources('tv', sourceCount);

  console.log('Fetching recommendations...');
  const rows = [
    ...(await buildRows('movie', movieIds, seenPairs)),
    ...(await buildRows('tv', tvIds, seenPairs)),
  ];

  console.log(`Built ${rows.length} curated rows.`);

  if (dryRun) {
    console.log(JSON.stringify(rows.slice(0, 10), null, 2));
    console.log(
      `(dry run — first 10 of ${rows.length} shown, nothing written)`,
    );
    return;
  }

  // ignoreDuplicates is essential: a normal upsert would OVERWRITE a real
  // user's suggestion whenever a pair collided.
  const { error } = await supabase.from('community_suggestions').upsert(rows, {
    onConflict: 'source_tmdb_id,source_type,target_tmdb_id,target_type',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error(`Insert failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} curated suggestions.`);
}

void main();
```

- [ ] **Step 3: Verify with a dry run**

Run: `pnpm seed:curated --dry-run --limit=3`
Expected: prints up to 10 rows, each with `source: 'curated'`, a `curated_rank` starting at 0 per source, and no `suggested_by`. Nothing written.

- [ ] **Step 4: Seed a small real batch against dev**

Run: `pnpm seed:curated --limit=3`

Then in the dev SQL editor:

```sql
select count(*) from public.community_suggestions where source = 'curated';
select source_tmdb_id, target_tmdb_id, curated_rank, suggested_by
from public.community_suggestions where source = 'curated'
order by source_tmdb_id, curated_rank limit 10;
```

Expected: rows present, `suggested_by` null, ranks starting at 0.

- [ ] **Step 5: Verify idempotency and purge**

Run `pnpm seed:curated --limit=3` a second time. Expected: the count from Step 4 is unchanged.

Run `pnpm seed:curated --purge`. Expected: reports the number deleted; the count query returns 0.

- [ ] **Step 6: Run the full check and commit**

Run: `pnpm check`

```bash
git add scripts/seed-curated.ts package.json
git commit -m "feat(scripts): add curated suggestion seed script"
```

---

### Task 6: Endorsement server action

**Files:**

- Modify: `src/actions/suggestions.ts` (append a new exported action)

**Interfaces:**

- Consumes: `createClient`, `getUser` from `@/lib/supabase/server`; `logActivity` from `@/actions/activity`.
- Produces: `endorseCuratedSuggestion(suggestionId: string): Promise<{ error: string | null }>`

- [ ] **Step 1: Write the action**

Append to `src/actions/suggestions.ts`:

```ts
// ---------------------------------------------------------------------------
// endorseCuratedSuggestion
// ---------------------------------------------------------------------------

/**
 * Adopt a curated suggestion as your own.
 *
 * Curated rows are deliberately not votable — votes on author-less rows would
 * blur the line the schema draws between seeded and real content. Adoption is
 * the alternative: the user takes authorship of the pair, and the
 * supersede_curated_suggestion trigger removes the placeholder in the same
 * transaction.
 *
 * Reputation is unaffected here. Reputation is the sum of vote_count across a
 * user's suggestions, so adopting grants nothing until other people vote for it
 * — endorsement cannot be farmed.
 */
export async function endorseCuratedSuggestion(
  suggestionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) {
    return { error: 'You must be logged in to suggest.' };
  }

  const { data: curated, error: fetchError } = await supabase
    .from('community_suggestions')
    .select(
      'id, source, source_tmdb_id, source_type, target_tmdb_id, target_type',
    )
    .eq('id', suggestionId)
    .single();

  if (fetchError || !curated) {
    return { error: 'This suggestion no longer exists.' };
  }

  // Guard against being handed a community row's id.
  if (curated.source !== 'curated') {
    return { error: 'This suggestion already belongs to someone.' };
  }

  // Same rule as createSuggestion: a community suggestion in the reverse
  // direction makes this redundant. Curated reverse rows are excluded — the
  // trigger removes those during the insert below.
  const { data: reverseExists } = await supabase
    .from('community_suggestions')
    .select('id')
    .eq('source_tmdb_id', curated.target_tmdb_id)
    .eq('source_type', curated.target_type)
    .eq('target_tmdb_id', curated.source_tmdb_id)
    .eq('target_type', curated.source_type)
    .eq('source', 'community')
    .limit(1);

  if (reverseExists && reverseExists.length > 0) {
    return { error: 'This suggestion already exists.' };
  }

  const { error } = await supabase.from('community_suggestions').insert({
    source_tmdb_id: curated.source_tmdb_id,
    source_type: curated.source_type,
    target_tmdb_id: curated.target_tmdb_id,
    target_type: curated.target_type,
    reason: null,
    suggested_by: user.id,
  });

  if (error) {
    // 23505: another user adopted the same pair first.
    if (error.code === '23505') {
      return { error: 'This suggestion already exists.' };
    }
    return { error: error.message };
  }

  void logActivity({
    userId: user.id,
    tmdbId: curated.source_tmdb_id,
    mediaType: curated.source_type,
    action: 'suggestion_created',
  });

  revalidatePath(`/${curated.source_type}/${curated.source_tmdb_id}`);
  revalidatePath(`/${curated.target_type}/${curated.target_tmdb_id}`);
  return { error: null };
}
```

Note `source` is omitted from the insert — the column defaults to `'community'`.

- [ ] **Step 2: Verify types and build**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 3: Manual verification against dev**

Seed a small batch (`pnpm seed:curated --limit=3`), start `pnpm dev`, log in, and call the action from a media page that has a curated suggestion. Then:

```sql
select id, source, suggested_by, curated_rank
from public.community_suggestions
where source_tmdb_id = <the source id>;
```

Expected: one row, `source = 'community'`, `suggested_by` = your user id, `curated_rank` null. Confirm your profile's `reputation` is still 0.

- [ ] **Step 4: Commit**

```bash
git add src/actions/suggestions.ts
git commit -m "feat(suggestions): let users adopt curated suggestions"
```

---

### Task 7: UI — curated section and card variant

**Files:**

- Modify: `src/components/recommendations/community-suggestions.tsx`
- Modify: `src/components/recommendations/suggestion-card.tsx`
- Modify: `src/messages/en.json`, `src/messages/pt.json`, `src/messages/es.json`, `src/messages/fr.json`

**Interfaces:**

- Consumes: `SuggestionWithVoteStatus` (Task 4), `endorseCuratedSuggestion` (Task 6).
- Produces: no new exports; `suggestion-card.tsx` gains an author-less rendering path driven by `suggestion.source`.

**Read this before starting:** unlike every other task here, Steps 2 and 3 give
directives rather than literal replacement code. Neither component was read while
this plan was written, so exact JSX would be invention — and invented JSX that
does not match the real markup is worse than an honest instruction. Read both
files first, then apply the changes described. The behavioural requirements are
exact; the markup is yours to fit to the existing structure.

- [ ] **Step 1: Add i18n keys to `src/messages/en.json` under `suggestions`**

```json
"curatedTitle": "Starter picks",
"curatedDescription": "Generated from TMDB recommendation data, not suggested by members yet.",
"suggestThisToo": "Suggest this too",
"suggestThisTooHint": "This will be added as your suggestion.",
"suggestionAdopted": "Added as your suggestion."
```

Then add the same five keys to `pt.json`, `es.json`, and `fr.json` with translations. Portuguese, for example:

```json
"curatedTitle": "Sugestões iniciais",
"curatedDescription": "Geradas a partir dos dados de recomendação da TMDB, ainda não sugeridas por membros.",
"suggestThisToo": "Sugerir também",
"suggestThisTooHint": "Isto será adicionado como a tua sugestão.",
"suggestionAdopted": "Adicionada como a tua sugestão."
```

- [ ] **Step 2: Split the list in `community-suggestions.tsx`**

Partition the suggestions before rendering, and render curated ones in their own labelled block below the community list. The list arrives already ordered by `compareSuggestions`, so partitioning preserves order:

```tsx
const communityPicks = suggestions.filter((s) => s.source === 'community');
const curatedPicks = suggestions.filter((s) => s.source === 'curated');
```

Render the existing section using `communityPicks`. Then, only when `curatedPicks.length > 0`, render a second section headed by `t('curatedTitle')` with `t('curatedDescription')` as sub-text, mapping `curatedPicks` through `SuggestionCard`.

The existing empty state (`noSuggestions`) must now key off `communityPicks.length === 0`, so it still invites contribution even when curated picks are shown.

- [ ] **Step 3: Add the author-less path to `suggestion-card.tsx`**

Guard the author byline and the vote control on `suggestion.source === 'community'`. For curated cards render the "Suggest this too" button instead, wired to `endorseCuratedSuggestion(suggestion.id)`, showing `t('suggestThisTooHint')` as helper text or tooltip, and `toast.success(t('suggestionAdopted'))` on success.

Because `suggestedByUsername` is now `string | null`, the byline must be conditional rather than defaulted — do **not** reintroduce a `?? 'unknown'` fallback. A curated row rendering as a user named "unknown" is exactly the misattribution the schema was designed to prevent.

- [ ] **Step 4: Verify**

Run: `pnpm check`

Then with `pnpm dev` and a seeded dev database, confirm on a media page with curated picks:

- Community section appears first; curated section is visually distinct and labelled.
- Curated cards show no username, no reputation, no vote button.
- "Suggest this too" moves the card into the community section after the router refresh.
- Logged out, the curated action prompts login rather than erroring.
- Layout holds at 375px, 768px, and 1440px.

- [ ] **Step 5: Commit**

```bash
git add src/components/recommendations/community-suggestions.tsx src/components/recommendations/suggestion-card.tsx src/messages/en.json src/messages/pt.json src/messages/es.json src/messages/fr.json
git commit -m "feat(recommendations): render curated picks as a distinct section"
```

---

### Task 8: Trending fallback — **DROPPED during execution**

> **Do not implement this task.** It was written without checking what the
> Discover and home pages already render. Both already show TMDB trending as
> their own section (`<TMDBTrending />` on Discover, a separate
> `getTrending('all', 'day')` on the home page), and both guard the Kristin row
> with `kristinTrending.length > 0` so an empty section does not render. A
> fallback would have displayed the same TMDB data twice on one page, solving a
> problem that did not exist.
>
> **What was kept instead:** `getPopularRecommendations` now filters
> `.eq('source', 'community')`. It ordered by `vote_count` with no source filter,
> so curated rows — `vote_count: 0` by design — would have appeared in "Popular
> recommendations" as though they were popular. That was a real bug, found while
> investigating this task.
>
> The steps below are retained only as a record of what was considered.

**Files:**

- Modify: `src/actions/discover.ts` (`getTrendingOnKristin`)

**Interfaces:**

- Consumes: `getTrending` from `@/lib/tmdb`, existing `TrendingItem` type.
- Produces: `getTrendingOnKristin` returns an added `isFallback: boolean` alongside `data` and `error`.

- [ ] **Step 1: Add the fallback threshold and return flag**

At the top of `src/actions/discover.ts`, near `ACTION_WEIGHTS`:

```ts
/**
 * Below this many distinct media in the activity window, "Trending on Kristin"
 * falls back to TMDB trending.
 *
 * 5 rather than 0 deliberately: one stray activity row should not replace a full
 * grid with a single lonely entry, which looks more broken than the fallback.
 *
 * activity_log is never seeded — an activity row asserts that someone did
 * something, and there is no honest label for a fabricated one.
 */
const TRENDING_FALLBACK_THRESHOLD = 5;
```

Change the signature's return type to include the flag:

```ts
export async function getTrendingOnKristin(
  limit = 12,
): Promise<{ data: TrendingItem[]; error: string | null; isFallback: boolean }>;
```

- [ ] **Step 2: Return the flag on every path**

Every existing `return` in the function gains `isFallback: false`. Then, after `sorted` is computed and before resolving TMDB info, add the block below.

Three things about `getTrending` that shape this code — verified against `src/lib/tmdb/client.ts:141`:

- Its signature is `getTrending(mediaType, timeWindow, { locale, page })`, and it **throws** on failure rather than returning an `error` field, so it needs a `try`/`catch`.
- It returns `PaginatedResponse<MovieListResult | TVListResult>`, not `TrendingItem[]` — mapping is required.
- `TrendingItem` (declared at `src/actions/discover.ts:11`) requires `activityScore: number`.

Movies and TV are fetched separately rather than via `'all'`. The `'all'` endpoint discriminates results with a `media_type` field, which would need a runtime type guard; fetching each type separately makes `mediaType` statically known and lets us use `title`/`release_date` versus `name`/`first_air_date` without narrowing.

```ts
if (sorted.length < TRENDING_FALLBACK_THRESHOLD) {
  try {
    const [movies, shows] = await Promise.all([
      getTrending('movie', 'week', { locale }),
      getTrending('tv', 'week', { locale }),
    ]);

    const half = Math.ceil(limit / 2);

    const movieItems: TrendingItem[] = (movies.results ?? [])
      .slice(0, half)
      .map((m) => ({
        tmdbId: m.id,
        mediaType: 'movie' as const,
        title: m.title,
        posterPath: m.poster_path,
        releaseDate: m.release_date,
        voteAverage: m.vote_average ?? null,
        // No Kristin activity by definition — this is the TMDB fallback.
        activityScore: 0,
      }));

    const showItems: TrendingItem[] = (shows.results ?? [])
      .slice(0, limit - movieItems.length)
      .map((s) => ({
        tmdbId: s.id,
        mediaType: 'tv' as const,
        title: s.name,
        posterPath: s.poster_path,
        releaseDate: s.first_air_date,
        voteAverage: s.vote_average ?? null,
        activityScore: 0,
      }));

    return {
      data: [...movieItems, ...showItems],
      error: null,
      isFallback: true,
    };
  } catch {
    // Fallback is best-effort: an empty trending section is worse than the
    // real data but far better than a 500 on Discover.
    return { data: [], error: null, isFallback: false };
  }
}
```

Add `getTrending` to the existing `@/lib/tmdb` import at the top of the file if it is not already there.

If `MovieListResult` / `TVListResult` in `src/lib/tmdb/types.ts` mark any of `title`, `name`, `release_date`, or `first_air_date` optional, `pnpm typecheck` will flag it — add `?? null` for the nullable `TrendingItem` fields and `?? ''` for `title`. Do not cast.

- [ ] **Step 3: Label the section in the UI**

In the Discover page component that renders `getTrendingOnKristin`, use `isFallback` to select the heading: `t('trendingOnTMDB')` when true, `t('trendingOnKristin')` when false. Both keys already exist in all four message files.

- [ ] **Step 4: Verify**

Run: `pnpm check`

With a dev database that has no recent activity, load Discover and confirm the section is populated and headed "Trending on TMDB". Then insert five activity rows for distinct media and confirm the heading switches to "Trending on Kristin":

```sql
insert into public.activity_log (user_id, tmdb_id, media_type, action)
select (select id from public.profiles limit 1), g, 'movie', 'media_viewed'
from generate_series(1, 5) as g;
```

Clean up afterwards:

```sql
delete from public.activity_log where tmdb_id between 1 and 5;
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/discover.ts
git commit -m "feat(discover): fall back to TMDB trending when activity is thin"
```

---

## Final verification

- [ ] `pnpm check` passes.
- [ ] `pnpm seed:curated --purge` then `pnpm seed:curated` against dev; media pages show curated picks.
- [ ] Adopt one curated suggestion; it moves to the community section and the placeholder is gone.
- [ ] Confirm no row anywhere has `source = 'curated'` with a non-null `suggested_by`:
      `select count(*) from public.community_suggestions where source = 'curated' and suggested_by is not null;` → must be 0.
- [ ] Update `ROADMAP.md`: mark curated seeding done, leave the DB test harness item open.
- [ ] Apply to prod only after dev is verified: `supabase link --project-ref wmlvriytjbhpuolbgnog`, `supabase migration list`, `supabase db push`, then seed. **Relink to dev afterwards.**

## Known gaps

- **No database test harness.** The CHECK constraint, the supersede trigger's behaviour under RLS, and the RLS rejection of forged curated rows are all verified manually. This is the single biggest weakness in this plan and is already a ROADMAP item.
- **The reverse-pair invariant lives in application code**, enforced by the seed script and the two server actions rather than the database. A unique index over a canonical ordering of the two `(type, id)` keys would make it structural. Out of scope here.
- **TMDB commercial-use terms** are unverified while the site serves AdSense.
