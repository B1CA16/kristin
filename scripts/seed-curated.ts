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
