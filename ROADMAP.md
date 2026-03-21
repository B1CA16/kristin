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
- [ ] Activity logging for list_add actions
- [ ] E2E: list management flow

### Reviews

- [ ] Server actions: `createReview`, `updateReview`, `deleteReview`, `getReviewsForMedia`, `getUserReviews` + integration tests
- [ ] Server actions: `voteReviewHelpful`, `unvoteReviewHelpful` + integration tests
- [ ] `StarRating` component (interactive + display modes, half-star support) + tests — **design approval required**
- [ ] `ReviewForm` (star rating + title + body, Zod validation) + tests
- [ ] `ReviewCard` (avatar, username, stars, date, text, helpful vote) + tests
- [ ] `ReviewList` (sort: Most Helpful / Newest / Highest / Lowest, pagination)
- [ ] `RatingDistribution` bar chart (average + total count)
- [ ] Reviews section on media detail pages
- [ ] Activity logging for review actions
- [ ] E2E: review creation + editing flow

---

## Phase 6: Discover/Trending & User Profiles

### Discover Page

- [ ] "Trending on Kristin" section (weighted activity_log aggregation, last 7 days) + tests
- [ ] "Trending on TMDB" section (TMDB trending endpoint, day/week toggle)
- [ ] "Popular Recommendations" section (highest-voted suggestions across all media)
- [ ] Genre browsing (scrollable chips + filtered discover grid) — **design approval required**
- [ ] Discover grid with filters (genre, year, sort) + infinite scroll
- [ ] E2E: discover page browsing

### User Profiles

- [ ] Profile page (`/profile/[username]`) — **design approval required**
- [ ] `ProfileHeader` (avatar, name, bio, reputation badge, join date) + tests
- [ ] `ProfileStats` (reviews count, suggestions made, total votes received)
- [ ] Activity tabs (Reviews / Suggestions / Favorites)
- [ ] Edit own profile (avatar upload via Supabase Storage, name, bio) + integration tests
- [ ] Server actions: `updateProfile`, `getPublicProfile`, `getProfileStats` + integration tests
- [ ] E2E: profile viewing + editing

### Reputation System

- [ ] `ReputationBadge` component (Newcomer / Contributor / Curator / Tastemaker / Legend) + tests
- [ ] Badge displayed next to username across the app

### Global Search

- [ ] Navbar search bar with autocomplete
- [ ] Recent searches (localStorage)

---

## Phase 7: Polish, Performance & Animations

### Animations (Framer Motion)

- [ ] Page transitions (AnimatePresence)
- [ ] Media card hover/entrance animations (staggered grid)
- [ ] Vote button spring animation + counter animation
- [ ] Animated vote count transitions
- [ ] Tab sliding underline indicator
- [ ] Modal enter/exit (scale + fade)
- [ ] List item add/remove layout animations
- [ ] Skeleton pulse animations

### Real-time

- [ ] Supabase Realtime subscription for vote updates (scoped to visible suggestions)

### E2E (deferred from Phase 4)

- [ ] E2E: full suggestion + voting flow

### Performance

- [ ] Next.js Image with proper `sizes` + priority for above-fold
- [ ] Dynamic imports for heavy components (TrailerModal, ReviewForm, AddSuggestionDialog)
- [ ] ISR with `generateStaticParams` for popular media pages
- [ ] Client-side caching with SWR or React Query
- [ ] `media_cache` TTL cleanup (Supabase Edge Function cron)

### Accessibility

- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels on icon buttons
- [ ] Focus management in modals
- [ ] `prefers-reduced-motion` support
- [ ] Color contrast compliance (both themes)

### SEO

- [ ] JSON-LD structured data (Schema.org Movie/TVSeries)
- [ ] Sitemap generation
- [ ] robots.txt
- [ ] Canonical URLs

### UX Polish

- [ ] Toast notifications for all user actions
- [ ] Empty states with illustrations
- [ ] Mobile bottom sheets + touch-friendly interactions
- [ ] Error boundaries per section + graceful TMDB degradation

### Quality Checks

- [ ] Lighthouse CI (target 90+ all categories)
- [ ] Accessibility audit
- [ ] Reduced motion behavior tests

---

## Phase 8: Deployment & Environment Strategy

### Environment Separation

- [ ] Production Supabase project (separate from dev)
- [ ] Environment variable strategy: dev / preview / production
- [ ] Document environment differences and how data flows between them

### Vercel Deployment

- [ ] Vercel project setup with environment variables per environment
- [ ] Run migrations on production
- [ ] Custom domain configuration
- [ ] DNS setup (A records, CNAME, understanding propagation)
- [ ] Preview deployment environment variables (separate Supabase for previews vs prod)

### CI/CD Maturation

- [ ] GitHub Actions: run E2E tests against preview deployments
- [ ] GitHub Actions: automated Lighthouse CI (fail if scores drop below thresholds)
- [ ] Deployment notifications (GitHub + optional Slack/Discord webhook)
- [ ] Rollback strategy (understand Vercel instant rollback, when to use it)

### Documentation

- [ ] README with setup instructions + architecture overview
- [ ] `.env.local.example` with all required variables documented
- [ ] Contributing guide (for open-source readiness)

---

## Phase 9: Security Hardening

### HTTP Security Headers

- [ ] Content Security Policy (CSP) — restrict script/style/image sources
- [ ] X-Frame-Options / X-Content-Type-Options / Referrer-Policy
- [ ] Strict-Transport-Security (HSTS)
- [ ] Permissions-Policy (camera, microphone, geolocation)
- [ ] Test headers with securityheaders.com

### Application Security

- [ ] Verify all RLS policies are active and correct (systematic audit)
- [ ] Verify TMDB API key never exposed to client (check network tab, source maps)
- [ ] Rate limiting on server actions (Upstash Redis or Vercel KV)
- [ ] Rate limiting on API routes (TMDB proxy)
- [ ] Input sanitization on all user-submitted text (XSS prevention)
- [ ] CSRF protection review (Next.js Server Actions have built-in protection — understand how)
- [ ] CORS policy review on API routes

### Dependency Security

- [ ] `npm audit` integrated into CI pipeline
- [ ] Dependabot or Renovate for automated dependency updates
- [ ] Review and pin critical dependency versions

### Auth Security

- [ ] Session expiration and refresh token rotation review
- [ ] OAuth state parameter verification
- [ ] Account enumeration prevention — replace client-side duplicate detection with custom email flow (existing users receive "you already have an account" email instead of UI error)
- [ ] Password strength requirements (if using email/password)

### Security Testing

- [ ] Basic penetration testing checklist (OWASP Top 10)
- [ ] Test RLS bypasses with different auth states
- [ ] Test API routes with malformed/missing auth tokens

---

## Phase 10: Production Infrastructure & Monitoring

### Error Tracking & Logging

- [ ] Sentry integration (client + server + edge)
- [ ] Structured logging for server actions and API routes
- [ ] Error boundaries per page section with Sentry reporting
- [ ] Source maps uploaded to Sentry (not exposed publicly)

### Uptime & Alerting

- [ ] Uptime monitoring (BetterUptime, UptimeRobot, or similar)
- [ ] Health check endpoint (`/api/health`) — checks Supabase connectivity
- [ ] Alert channels (email, Discord/Slack webhook) for downtime + error spikes

### Performance Monitoring

- [ ] Vercel Analytics (Web Vitals — LCP, FID, CLS, TTFB)
- [ ] Vercel Speed Insights for real user monitoring (RUM)
- [ ] Performance budgets: bundle size limits in CI
- [ ] Database query performance review (slow query identification, index analysis)

### Database Operations

- [ ] Supabase connection pooling configuration (understand PgBouncer)
- [ ] Database backup strategy (Supabase automatic backups + point-in-time recovery)
- [ ] `media_cache` TTL cleanup (Supabase Edge Function cron or pg_cron)
- [ ] Index analysis: verify all frequent queries are using indexes

### CDN & Edge

- [ ] Understand Vercel's CDN/edge network and how static assets are served
- [ ] Cache-Control headers strategy (static assets, API responses, ISR pages)
- [ ] Image optimization pipeline (Next.js Image + Vercel OG)
- [ ] Understand cold starts vs warm functions (serverless vs edge runtime)

### Scaling Awareness

- [ ] Supabase free tier limits — understand what happens when you hit them
- [ ] Vercel free tier limits (bandwidth, serverless function invocations, build minutes)
- [ ] Database connection limits and pooling under concurrent users
- [ ] Identify which features would need rearchitecting at 10k, 100k, 1M users

---

## Phase 11: Analytics, Monetization & Compliance

### Analytics

- [ ] Vercel Web Analytics (privacy-friendly, no cookies)
- [ ] Custom event tracking (search queries, suggestion votes, popular media)
- [ ] Dashboard/tracking for key metrics: DAU, suggestions per day, most-searched media
- [ ] UTM parameter handling for marketing/sharing attribution

### Monetization (Ads)

- [ ] Research ad networks (Google AdSense, Carbon Ads, EthicalAds) — **user decision required**
- [ ] Ad placement strategy (non-intrusive, doesn't break UX) — **design approval required**
- [ ] Ad component with lazy loading (don't block page render)
- [ ] Test ad impact on Core Web Vitals (ads are a common LCP/CLS killer)
- [ ] Ad-blocker graceful degradation (don't break the site)

### Cookie Consent & Privacy

- [ ] Cookie consent banner (GDPR/ePrivacy compliance) — **design approval required**
- [ ] Cookie policy page (what cookies, why, how long)
- [ ] Privacy policy page (data collection, storage, third-party services)
- [ ] Terms of service page
- [ ] Consent state management (analytics + ads only after consent)
- [ ] Understand GDPR basics: data minimization, right to erasure, lawful basis

### SEO Maturation

- [ ] Google Search Console setup + sitemap submission
- [ ] Monitor crawl errors, index coverage, Core Web Vitals in Search Console
- [ ] Structured data testing (Schema.org validation)
- [ ] Social media preview testing (OpenGraph debugger, Twitter Card validator)
- [ ] Internal linking strategy (related media, user profiles, genre pages)

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
