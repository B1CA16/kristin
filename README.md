# Kristin

Community-driven movie and TV show recommendation platform. Users suggest similar titles, vote on the best picks, write reviews, and build personal watchlists.

**Live:** [trykristin.vercel.app](https://trykristin.vercel.app)

## What is Kristin?

Most recommendation engines are black boxes. Kristin flips this — real people suggest what to watch next, and the community votes the best picks to the top. Combined with TMDB's algorithm-based recommendations, you get the best of both worlds.

### Core Features

- **Community Suggestions** — Users recommend similar movies/shows on any title page. The best suggestions rise through upvotes.
- **Reviews & Ratings** — Half-star precision (1-10 scale), helpful vote system, rating distribution charts.
- **Personal Lists** — Watchlist, watched, and favorites with optional public sharing.
- **Discover** — Trending content from the community and TMDB, popular recommendations.
- **Browse** — Filterable grid with genre, year, and sort options. Infinite scroll.
- **User Profiles** — Reputation badges, activity tabs (reviews/suggestions/favorites), editable profiles.
- **Global Search** — Autocomplete with recent items, powered by TMDB multi-search.
- **Internationalization** — Full i18n support (English, Portuguese, Spanish, French).
- **Dark/Light Mode** — System-aware theme switching.

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router) + TypeScript        |
| UI         | Tailwind CSS + shadcn/ui + Framer Motion    |
| Database   | PostgreSQL via Supabase (RLS enabled)       |
| Auth       | Supabase Auth (email/password)              |
| Media Data | TMDB API                                    |
| i18n       | next-intl (EN, PT, ES, FR)                  |
| Deployment | Vercel                                      |
| Testing    | Vitest + React Testing Library + Playwright |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project
- A [TMDB API key](https://developer.themoviedb.org)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/B1CA16/kristin.git
cd kristin
```

2. Install dependencies:

```bash
pnpm install
```

3. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

5. Apply database migrations to your Supabase project:

```bash
supabase db push
```

6. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start development server                            |
| `pnpm build`     | Production build                                    |
| `pnpm check`     | Run lint + format check + typecheck + tests + build |
| `pnpm lint`      | ESLint                                              |
| `pnpm format`    | Prettier (write)                                    |
| `pnpm typecheck` | TypeScript type checking                            |
| `pnpm test:run`  | Run tests once                                      |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── [locale]/           # i18n locale prefix (en, pt, es, fr)
│   │   ├── (auth)/         # Auth pages (login, signup)
│   │   ├── (main)/         # Main app pages with shared layout
│   │   └── page.tsx        # Landing page
│   └── api/                # Route handlers (TMDB proxy)
├── actions/                # Server Actions (suggestions, reviews, lists, profile, discover)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Navbar, footer, theme toggle
│   ├── media/              # Media cards, hero, cast, providers
│   ├── recommendations/    # Community suggestions, voting
│   ├── reviews/            # Star rating, review cards, distribution chart
│   ├── search/             # Search bar, autocomplete, browse grid
│   ├── discover/           # Trending, genre combobox, filters
│   └── profile/            # Profile header, stats, tabs, edit dialog
├── hooks/                  # Custom hooks (debounce, infinite scroll, optimistic updates)
├── i18n/                   # Internationalization config
├── lib/
│   ├── supabase/           # Supabase clients (browser, server, admin)
│   └── tmdb/               # TMDB API wrapper, types, image helpers
├── messages/               # Translation files (en, pt, es, fr)
├── types/                  # TypeScript types
└── providers/              # React context providers
```

## Database

9 tables with Row Level Security (RLS) enabled on all:

- `profiles` — User profiles with reputation, auto-created on signup
- `community_suggestions` — "If you like X, you'll like Y" recommendations
- `suggestion_votes` — Upvotes on suggestions (triggers sync vote_count + reputation)
- `user_lists` — Watchlist, watched, favorites
- `reviews` — Star ratings (1-10) with optional title and body
- `review_votes` — Helpful votes on reviews
- `activity_log` — Powers trending algorithm (weighted by action type)
- `keepalive` — Singleton heartbeat row, see [Operations](#operations)

## Operations

### Keeping the database alive

Supabase pauses Free-plan projects after **7 consecutive days without database
activity**. Two independent schedulers prevent that by calling
`public.ping_keepalive()`, which bumps a single row in `public.keepalive`.

The RPC is executable by `anon`, so neither scheduler needs a secret — the anon
key is already public. **Do not** switch this to the service role key: that key
bypasses RLS on every table, and one of the two schedulers is a third party.

**1. GitHub Actions** — `.github/workflows/keepalive.yml`, daily at 03:00 UTC.
Requires:

| Kind                | Name                       | Value                       |
| ------------------- | -------------------------- | --------------------------- |
| Repository variable | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| Repository secret   | `SUPABASE_ANON_KEY`        | The project's anon key      |

**2. External backstop** — a job on [cron-job.org](https://cron-job.org) every 3
days. This exists because **GitHub silently disables scheduled workflows in
public repos after 60 days with no pushes**, so Actions alone is not a
sufficient guarantee. cron-job.org rather than UptimeRobot because the RPC
writes, so PostgREST only accepts `POST`, and UptimeRobot's free tier sends only
`GET`/`HEAD`.

```
POST https://<ref>.supabase.co/rest/v1/rpc/ping_keepalive
apikey: <anon key>
Authorization: Bearer <anon key>
Content-Type: application/json

{}
```

Verify either scheduler worked — run in the Supabase SQL editor, since RLS makes
the table unreachable through the REST API:

```sql
select last_ping, ping_count from public.keepalive;
```

If the RPC returns 404 immediately after migrating, PostgREST hasn't reloaded its
schema cache yet: `notify pgrst, 'reload schema';`

**If the project pauses anyway,** restore it from the Supabase dashboard, then
check both schedulers before assuming the ping is at fault — a disabled GitHub
workflow shows no failed runs at all, which reads identically to "never ran".

### Database size and read-only mode

The Free plan puts a project into **read-only mode once database size exceeds
500 MB**. Check what's using the space:

```sql
select relname, pg_size_pretty(pg_total_relation_size(c.oid)) as size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc;
```

Two things to know before trying to free space:

- **`DELETE` frees no disk.** It only marks tuples dead. Reclaiming requires
  `VACUUM FULL`, which needs free space roughly equal to the table it rewrites —
  so it is precisely unavailable when you need it. `DROP TABLE` and `TRUNCATE`
  release space immediately.
- **DDL is blocked in read-only mode.** Override it for the session, in the same
  SQL editor execution as the statement that needs it:

  ```sql
  set default_transaction_read_only to false;
  drop table if exists public.some_bloated_table;
  ```

Read-write mode re-enables automatically once usage falls back under the
threshold.

This bit us once: `media_cache` reached 777 MB because its TTL pruning ran from a
cron job that called the app on Vercel. When that deployment went down, pruning
stopped silently. **A cache whose cleanup depends on infrastructure outside the
database has no upper bound.** Prefer structures that cannot grow — see the
`check (id = 1)` constraint on `keepalive` — over structures that need a janitor.

### Image optimization

TMDB images bypass Vercel's Image Optimization via a custom `next/image` loader
(`src/lib/tmdb/image-loader.ts`) that maps requested widths onto TMDB's own size
buckets. TMDB already serves pre-resized variants from its CDN, so optimizing
them again spends quota — **5,000 transformations/month on Vercel Hobby** — to
re-encode files that are already correct.

This matters because exceeding that limit does not produce an obvious outage:
new images return **HTTP 402** and `next/image` renders the alt text, so the
symptom is "all the posters broke" and the usual misdiagnosis is a TMDB problem.

Consequence to be aware of: `loaderFile` is global, so **no** images are
optimized by Vercel any more, including local assets and Supabase avatars. Those
are passed through and served as-is.

## License

MIT
