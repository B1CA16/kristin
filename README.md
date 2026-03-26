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
- `media_cache` — Cached TMDB API responses
- `activity_log` — Powers trending algorithm (weighted by action type)

## License

MIT
