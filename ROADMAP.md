# Development Roadmap

Implementation checklist. Mark items `[x]` when complete.
A feature is not done until it is implemented, documented, and tested.

For the high-level feature roadmap with phases (MVP → v2.0), see `FEATURES.md`.

---

## Phase 1: Foundation

### Project Setup

- [x] Initialize Next.js 16 + TypeScript + Tailwind CSS
- [x] Configure ESLint + Prettier
- [x] Install and configure shadcn/ui (core components — to be customized)
- [x] Install Framer Motion, next-themes, Zod, date-fns
- [x] Set up environment variables (`.env.local` + `.env.local.example`)
- [x] Set up Vitest + React Testing Library + Playwright

### CI/CD Pipeline (early — build the habit from day one)

- [x] GitHub Actions: lint + type-check + test on every PR
- [x] GitHub Actions: build verification
- [ ] Branch protection rules on `main` (require CI pass, require PR review)
- [ ] Vercel preview deployments (automatic per PR)
- [x] `.github/PULL_REQUEST_TEMPLATE.md` for consistent PR descriptions

### Internationalization (i18n)

- [x] Install and configure `next-intl`
- [x] Set up locale routing (`[locale]` dynamic segment)
- [x] Create translation files (en.json, pt.json, es.json, fr.json)
- [x] Middleware for locale detection and redirects
- [x] Language switcher component

### Database

- [x] Create Supabase project
- [x] Migration: enums (`media_type_enum`, `list_type_enum`)
- [x] Migration: `profiles` table + RLS policies
- [x] Migration: `community_suggestions` table + indexes + RLS
- [x] Migration: `suggestion_votes` table + RLS
- [x] Migration: `user_lists` table + RLS
- [x] Migration: `reviews` table + RLS
- [x] Migration: `review_votes` table + RLS
- [x] Migration: `media_cache` table
- [x] Migration: `activity_log` table
- [x] Migration: functions + triggers (profile auto-create, vote_count sync, reputation sync, helpful_count sync, updated_at)
- [x] Generate TypeScript types from Supabase schema
- [ ] Tests: RLS policy tests for all tables
- [ ] Tests: trigger verification (profile auto-create, vote_count sync, reputation sync)

### Auth

- [x] Supabase browser client (`lib/supabase/client.ts`)
- [x] Supabase server client (`lib/supabase/server.ts`)
- [x] Supabase admin client (`lib/supabase/admin.ts`)
- [x] Next.js middleware for auth session refresh + locale handling
- [x] Login page (tests pending)
- [x] Signup page (tests pending)
- [x] OAuth callback route
- [ ] Auth provider (React context)
- [ ] Tests: auth flow integration tests

### Layout & UI System

- [x] Define custom design tokens (colors, spacing, typography, radii) — **user approval required**
- [x] Customize shadcn/ui theme to match design system
- [x] Root layout with ThemeProvider, AuthProvider, ToastProvider, NextIntlProvider
- [x] Navbar (logo, search placeholder, theme toggle, language switcher, auth buttons) + tests
- [x] Footer + tests
- [x] Dark/light mode toggle
- [x] Mobile navigation (Sheet/drawer) + tests

---

## Phase 2: TMDB Integration & Search

### TMDB API Layer

- [x] TMDB API wrapper (`lib/tmdb/client.ts`) with cache + retry logic + tests
- [x] TMDB TypeScript types (`lib/tmdb/types.ts`)
- [x] Image URL helpers (`lib/tmdb/image.ts`) + tests
- [x] TMDB config (image sizes, cache TTLs, locale mapping)
- [x] Locale-aware TMDB requests (pass user's language for localized data)

### API Routes

- [x] `GET /api/tmdb/search` — proxied multi-search
- [x] `GET /api/tmdb/trending` — trending (day/week)
- [x] `GET /api/tmdb/discover` — discover with genre/year/sort filters

### Search UI

- [x] `SearchBar` component with debounced autocomplete (300ms) + tests
- [x] Search results page (`/search`) with infinite scroll
- [x] `MediaCard` component (poster, title, year, rating, hover animation) + tests — **design approval required**
- [x] `MediaGrid` responsive grid layout
- [x] Search filter tabs (All / Movies / TV Shows)
- [x] Skeleton loading states for search

### Hooks

- [x] `useDebounce` hook + tests
- [x] `useInfiniteScroll` hook (IntersectionObserver) + tests

---

## Phase 3: Media Detail Pages

### Movie Detail

- [x] Movie page (`/movie/[id]`) — SSR with `generateMetadata` + rendering tests
- [x] Hero section (backdrop + gradient + poster + metadata) — **design approval required**
- [x] `append_to_response` for single API call (details + credits + videos + providers + similar + recommendations)

### TV Detail

- [x] TV page (`/tv/[id]`) — SSR with `generateMetadata` + rendering tests
- [x] TV-specific fields (seasons, episodes, status, network)

### Shared Components

- [x] `MediaHero` component — **design approval required**
- [x] `MediaDetails` info section (genres, runtime, etc.)
- [x] `CastCarousel` horizontal scrollable cast list + tests
- [x] `TrailerModal` YouTube embed in Dialog
- [x] `WatchProviders` streaming/rent/buy with logos + JustWatch attribution + tests
- [ ] `MediaActions` placeholder (watchlist/favorite/rating buttons, non-functional)
- [x] `GenreBadge` component with navigation to discover
- [x] Loading skeletons for detail pages

### SEO & Social

- [ ] Dynamic OG image generation (`/api/og`) via `@vercel/og` + tests
- [x] Proper meta tags and `generateMetadata` for all detail pages

### API Routes

- [x] `GET /api/tmdb/movie/[id]` — movie details proxy
- [x] `GET /api/tmdb/tv/[id]` — TV details proxy

---

## Phase 4: Community Recommendation System

### Core Components

- [x] `RecommendationTabs` (Community Picks / Algorithm) — **design approval required**
- [x] `CommunitySuggestions` list (sorted by vote_count DESC, pagination)
- [x] `SuggestionCard` (poster, title, vote count, upvote button, optimistic UI) + tests — **design approval required**
- [x] `AddSuggestionDialog` (search modal, reason text, duplicate prevention) + tests
- [x] `AlgorithmRecommendations` (TMDB similar + recommendations grid)

### Server Actions

- [x] `createSuggestion` — validates auth, checks duplicates, inserts, logs activity + integration tests
- [x] `voteSuggestion` — validates auth, inserts vote, returns updated count + integration tests
- [x] `unvoteSuggestion` — deletes vote, returns updated count + integration tests
- [x] `getSuggestionsForMedia` — returns suggestions with vote counts + user vote status

### Hooks

- [x] `useOptimisticVote` hook (optimistic state + rollback on error) + tests

---

## Phase 5: User Lists, Reviews & Ratings

### Lists

- [x] Server actions: `toggleListItem`, `getListStatus`, `getUserList` + integration tests
- [x] `MediaActions` component functional (watchlist/watched/favorite toggles, optimistic UI) + tests
- [x] Lists page (`/lists`) with tabs (Watchlist / Watched / Favorites) + sort options — **design approval required**
- [x] Activity logging for list_add actions
- [ ] E2E: list management flow

### Reviews

- [x] Server actions: `createReview`, `updateReview`, `deleteReview`, `getReviewsForMedia`, `getUserReview`, `getRatingDistribution` + integration tests
- [x] Server actions: `voteReviewHelpful`, `unvoteReviewHelpful` + integration tests
- [x] `StarRating` component (interactive + display modes, half-star support) + tests — **design approval required**
- [x] `ReviewForm` (star rating + title + body, Zod validation) + tests
- [x] `ReviewCard` (avatar, username, stars, date, text, helpful vote) + tests
- [x] `ReviewList` (sort: Most Helpful / Newest / Highest / Lowest, pagination)
- [x] `RatingDistribution` bar chart (average + total count)
- [x] Reviews section on media detail pages
- [x] `useOptimisticHelpful` hook for helpful vote optimistic UI
- [x] Activity logging for review actions
- [ ] E2E: review creation + editing flow

---

## Phase 6: Discover/Trending & User Profiles

### Discover Page

- [x] "Trending on Kristin" section (weighted activity_log aggregation, last 7 days) + tests
- [x] "Trending on TMDB" section (TMDB trending endpoint, day/week toggle)
- [x] "Popular Recommendations" section (highest-voted suggestions across all media)
- [x] Genre browsing (scrollable chips + filtered discover grid) — **design approval required**
- [x] Discover grid with filters (genre, year, sort) + infinite scroll
- [ ] E2E: discover page browsing

### User Profiles

- [x] Profile page (`/profile/[username]`) — **design approval required**
- [x] `ProfileHeader` (initial letter avatar, name, bio, reputation badge, join date) + tests
- [x] `ProfileStats` (reviews count, suggestions made, total votes received)
- [x] Activity tabs (Reviews / Suggestions / Favorites with public toggle)
- [x] Edit own profile (username with 30-day cooldown, display name, bio, public favorites toggle) + integration tests
- [x] Server actions: `updateProfile`, `getPublicProfile`, `getProfileReviews`, `getProfileSuggestions`, `getProfileFavorites` + integration tests
- [x] Migration: `public_favorites` + `username_changed_at` columns, public favorites RLS policy
- [ ] Avatar upload via Supabase Storage (deferred — storage limits)
- [ ] E2E: profile viewing + editing

### Reputation System

- [x] `ReputationBadge` component (Newcomer / Contributor / Curator / Tastemaker / Legend) + tests
- [x] Reputation tier utility (`src/lib/reputation.ts`)
- [x] Badge displayed next to username across the app (review cards, suggestion cards)

### Global Search

- [x] Navbar search bar with autocomplete
- [x] Recent searches (localStorage via `useSyncExternalStore`)

---

## Phase 7: Polish, Performance & Animations

### Animations (Framer Motion)

- [x] Page transitions (template.tsx fade-in on navigation)
- [x] Media card hover/entrance animations
- [x] Vote/helpful button animations
- [x] Tab sliding underline indicator (profile tabs with layoutId)
- [x] Modal enter/exit (scale + fade via shadcn Dialog)
- [x] List item add/remove layout animations (AnimatePresence in list-grid)
- [x] Skeleton pulse animations (rounded shapes matching design system)
- [x] Hero backdrop zoom animation
- [x] Landing page stagger entrance (hero, how-it-works, content sections)
- [x] Media detail hero: backdrop fade, poster slide-up, metadata stagger
- [x] Profile stats count-up animation
- [x] Scroll-aware navbar shadow
- [x] `prefers-reduced-motion` support in all motion wrappers

### Real-time (deferred)

- [ ] Supabase Realtime subscription for vote updates (scoped to visible suggestions)

### E2E (deferred)

- [ ] E2E: full suggestion + voting flow

### Performance

- [x] Next.js Image with proper `sizes` + priority for above-fold (hero images)
- [x] Dynamic imports for heavy components (TrailerModal, ReviewForm, AddSuggestionDialog)
- [ ] ISR with `generateStaticParams` for popular media pages (deferred — not practical for dynamic TMDB pages)
- [ ] Client-side caching with SWR or React Query (deferred — current server actions are sufficient)
- [ ] `media_cache` TTL cleanup (deferred — Supabase Edge Function cron)

### Accessibility

- [x] Keyboard navigation for all interactive elements (Radix UI handles this)
- [x] ARIA labels on icon buttons (all icon buttons audited — pass)
- [x] Focus management in modals (Radix Dialog/Sheet auto-traps focus)
- [x] `prefers-reduced-motion` support
- [x] Color contrast compliance (muted-foreground darkened for WCAG AA)
- [x] `hreflang` alternate language links

### SEO

- [x] JSON-LD structured data (Schema.org Movie/TVSeries)
- [x] Sitemap generation
- [x] robots.txt
- [x] Canonical URLs
- [x] OpenGraph + Twitter card metadata on detail pages
- [x] `metadataBase` configured for absolute URLs

### UX Polish

- [x] Toast notifications for all user actions (reviews, suggestions, lists, profile)
- [x] Empty states with icons (suggestions, reviews, lists, profile tabs)
- [ ] Mobile bottom sheets + touch-friendly interactions (deferred)
- [x] Error boundary page (`error.tsx`) with styled fallback
- [x] Reusable `ErrorBoundary` component for section isolation

### Quality Checks

- [ ] Lighthouse CI (target 90+ all categories) (deferred — pre-launch)
- [x] Accessibility audit (all icon buttons, form labels, focus management, skip-to-content link)
- [ ] Reduced motion behavior tests (deferred — pre-launch)

---

## Phase 8: Deployment & Environment Strategy

### Environment Separation

- [x] Production Supabase project (separate from dev)
- [x] Environment variable strategy: dev / preview / production (Vercel scoped env vars)
- [ ] Document environment differences and how data flows between them

### Vercel Deployment

- [x] Vercel project setup with environment variables per environment
- [x] Run migrations on production
- [ ] Custom domain configuration (deferred — costs money)
- [ ] DNS setup (A records, CNAME, understanding propagation) (deferred)
- [x] Preview deployment environment variables (dev Supabase for previews, prod for production)

### CI/CD Maturation

- [x] GitHub Actions: lint + typecheck + test + build (optimized to 2 jobs)
- [x] Branch protection on `main` (require PR, require CI pass, no bypass)
- [ ] GitHub Actions: run E2E tests against preview deployments (deferred)
- [ ] GitHub Actions: automated Lighthouse CI (deferred)
- [ ] Deployment notifications (GitHub + optional Slack/Discord webhook)
- [ ] Rollback strategy (understand Vercel instant rollback, when to use it)

### Documentation

- [x] README with setup instructions + architecture overview
- [x] `.env.local.example` with all required variables documented
- [x] Contributing guide (for open-source readiness)

---

## Phase 9: Security Hardening

### HTTP Security Headers

- [ ] Content Security Policy (CSP) — deferred, complex with Next.js inline scripts
- [x] X-Frame-Options / X-Content-Type-Options / Referrer-Policy
- [x] Strict-Transport-Security (HSTS)
- [x] Permissions-Policy (camera, microphone, geolocation)
- [x] Test headers with securityheaders.com (Grade A)

### Application Security

- [x] Verify all RLS policies are active and correct (audited — no critical gaps)
- [x] Verify TMDB API key never exposed to client (server-only, no NEXT*PUBLIC* prefix)
- [ ] Rate limiting on server actions (deferred — needs Redis for production-grade)
- [ ] Rate limiting on API routes (deferred — needs Redis)
- [x] Input sanitization on all user-submitted text (shared `sanitizeText` utility)
- [x] CSRF protection review (Next.js Server Actions validate Origin header automatically)
- [x] CORS policy review on API routes (same-origin default, no external access)

### Dependency Security

- [x] `npm audit` integrated into CI pipeline (audit-level=high)
- [x] Dependabot for automated dependency updates (weekly npm + GitHub Actions)
- [ ] Review and pin critical dependency versions

### Auth Security

- [x] Session expiration and refresh token rotation (Supabase handles automatically via middleware refresh)
- [ ] OAuth providers (Google/GitHub login)
- [x] Account enumeration prevention (Supabase returns fake success for existing emails)
- [x] Password strength requirements (Supabase enforces min 6 chars, signup form validates)

### Security Testing

- [ ] Basic penetration testing checklist (OWASP Top 10) (deferred — pre-launch)
- [ ] Test RLS bypasses with different auth states (deferred — pre-launch)
- [ ] Test API routes with malformed/missing auth tokens (deferred — pre-launch)

---

## Phase 10: Production Infrastructure & Monitoring

### Error Tracking & Logging

- [ ] Sentry integration (deferred — free tier available but adds complexity)
- [x] Structured logging utility (`src/lib/logger.ts` — JSON in prod, readable in dev)
- [x] Error boundaries per page section (`error.tsx` + `ErrorBoundary` component)
- [ ] Source maps uploaded to Sentry (deferred)

### Uptime & Alerting

- [ ] Uptime monitoring (BetterUptime, UptimeRobot, or similar) — free tiers available
- [x] Health check endpoint (`/api/health`) — checks Supabase connectivity + latency
- [ ] Alert channels (email, Discord/Slack webhook) for downtime + error spikes

### Performance Monitoring

- [x] Vercel Analytics (Web Vitals — LCP, FID, CLS, TTFB)
- [x] Vercel Speed Insights for real user monitoring (RUM)
- [x] Performance budgets: bundle size check in CI (warns if chunks exceed 2MB)
- [x] Database query performance review (all query patterns have matching indexes)

### Database Operations

- [x] Supabase connection pooling (PgBouncer enabled by default)
- [x] Database backup strategy (Supabase daily backups, 7-day retention on free tier)
- [x] `media_cache` TTL cleanup (GitHub Actions daily cron → `/api/cron/cleanup-cache`)
- [x] Index analysis: all frequent queries verified against indexes

### CDN & Edge (understanding documented)

- [x] Understand Vercel's CDN/edge network and how static assets are served
- [x] Cache-Control headers on TMDB API routes (s-maxage + stale-while-revalidate)
- [x] Image optimization pipeline (dynamic OG images via `@vercel/og` for social sharing)
- [x] Understand cold starts vs warm functions (serverless vs edge runtime)

### Scaling Awareness (understanding documented)

- [x] Supabase free tier limits — 500MB DB, 60 connections, 1GB storage
- [x] Vercel free tier limits — 100GB bandwidth, 100k invocations, 6k build mins
- [x] Database connection limits and pooling under concurrent users
- [x] Identify which features would need rearchitecting at 10k, 100k, 1M users

---

## Phase 11: Analytics, Monetization & Compliance

### Analytics

- [x] Vercel Web Analytics (privacy-friendly, no cookies)
- [x] Custom event tracking (search queries, suggestion votes, popular media)
- [x] Dashboard/tracking for key metrics: DAU, suggestions per day, most-searched media
- [x] UTM parameter handling for marketing/sharing attribution

### Monetization (Ads)

- [x] Research ad networks (Google AdSense, Carbon Ads, EthicalAds) — **user decision required**
- [x] Ad placement strategy (non-intrusive, doesn't break UX) — **design approval required**
- [x] Ad component with lazy loading (don't block page render)
- [x] Test ad impact on Core Web Vitals (ads are a common LCP/CLS killer)
- [x] Ad-blocker graceful degradation (don't break the site)

### Cookie Consent & Privacy

- [x] Cookie consent banner (GDPR/ePrivacy compliance) — **design approval required**
- [x] Cookie policy page (what cookies, why, how long)
- [x] Privacy policy page (data collection, storage, third-party services)
- [x] Terms of service page
- [x] Consent state management (analytics + ads only after consent)
- [x] Understand GDPR basics: data minimization, right to erasure, lawful basis

### SEO Maturation

- [x] Google Search Console setup + sitemap submission
- [x] Monitor crawl errors, index coverage, Core Web Vitals in Search Console
- [ ] Structured data testing (Schema.org validation)
- [ ] Social media preview testing (OpenGraph debugger, Twitter Card validator)
- [x] Internal linking strategy (related media, user profiles, genre pages)

### Social & Growth

- [ ] Social sharing buttons (share a suggestion, share a review)
- [ ] OpenGraph previews optimized for sharing (dynamic OG images per media page)
- [ ] `robots.txt` fine-tuning (crawl budget optimization)

---

## Phase 12: Final Validation & Launch

### Pre-Launch Checklist

- [ ] Full test suite passes (unit + integration + E2E)
- [ ] Responsive E2E tests (mobile 375px, tablet 768px, desktop 1440px)
- [ ] Lighthouse CI scores 90+ all categories (Performance, Accessibility, Best Practices, SEO)
- [ ] Security headers score A+ on securityheaders.com
- [ ] All user-facing text is translated (EN, PT, ES, FR)
- [ ] Error tracking confirmed working (trigger test error, verify Sentry receives it)
- [ ] Uptime monitoring confirmed working
- [ ] Backup/restore tested at least once

### Smoke Testing on Production

- [ ] Search + media detail pages load correctly
- [ ] Auth flow (signup, login, logout, OAuth)
- [ ] Suggestion + voting flow
- [ ] Review creation + editing
- [ ] List management (watchlist, favorites, watched)
- [ ] Profile viewing + editing
- [ ] Language switching
- [ ] Dark/light mode
- [ ] Mobile responsiveness spot-check

### Launch

- [ ] Go live on custom domain
- [ ] Submit sitemap to Google Search Console
- [ ] Social media announcement
- [ ] Monitor error rates and performance for first 48 hours
