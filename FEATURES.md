# Feature Roadmap

Features organized by release phase, from MVP to full vision.
Each feature moves through: **Planned → In Progress → Done**.

---

## MVP — Core Experience

The minimum product that delivers value: search, discover, and get community-driven recommendations.

### Search & Discovery
- [ ] Search movies and TV shows via TMDB
- [ ] Autocomplete search with debounced input
- [ ] Media detail pages (poster, backdrop, synopsis, genres, cast, runtime, ratings)
- [ ] Trailer playback (YouTube embed)
- [ ] "Where to Watch" streaming provider info
- [ ] Trending and popular content on homepage

### Community Recommendations (Core Differentiator)
- [ ] Users suggest "if you liked X, try Y" on any media page
- [ ] Upvote system — most-liked suggestions rise to the top
- [ ] Optimistic UI for instant vote feedback
- [ ] Real-time vote count updates across users
- [ ] Duplicate suggestion prevention (one entry per media pair)
- [ ] Optional reason text ("same director", "similar vibe")

### Algorithm Recommendations
- [ ] TMDB "similar" and "recommendations" data
- [ ] Genre-based matching

### User Accounts
- [ ] Email/password signup and login
- [ ] OAuth (Google, GitHub)
- [ ] Auto-created user profiles
- [ ] Session management via middleware

### Internationalization
- [ ] Multi-language support (EN, PT, ES, FR)
- [ ] Locale-aware routing (`/en/movie/123`, `/pt/movie/123`)
- [ ] Localized TMDB data (titles, descriptions in user's language)
- [ ] Language switcher in UI

### Foundation
- [ ] Dark / light / system theme
- [ ] Fully responsive (mobile-first)
- [ ] SEO — SSR, meta tags, Open Graph images
- [ ] Custom design system built on shadcn/ui

---

## v1.1 — Engagement & Personalization

Features that make users come back: personal lists, reviews, and profiles.

### Personal Lists
- [ ] Watchlist (want to watch)
- [ ] Watched (already seen)
- [ ] Favorites
- [ ] Lists page with tabs and sorting

### Reviews & Ratings
- [ ] Star ratings (1-10 scale, displayed as 5 stars)
- [ ] Text reviews with optional title
- [ ] "Helpful" votes on reviews
- [ ] Rating distribution chart per media item
- [ ] Sort reviews by helpfulness, date, rating

### User Profiles
- [ ] Public profile page (`/profile/username`)
- [ ] Avatar, display name, bio
- [ ] Contribution stats (reviews, suggestions, votes received)
- [ ] Activity history (recent reviews, suggestions)
- [ ] Profile editing

### Reputation System
- [ ] Points earned when others upvote your suggestions or mark reviews helpful
- [ ] Tiered badges: Newcomer → Contributor → Curator → Tastemaker → Legend
- [ ] Badges displayed next to username across the app

### Discover Page
- [ ] "Trending on Kristin" — most-engaged media in the last 7 days
- [ ] "Trending on TMDB" — global trending
- [ ] "Top Community Picks" — highest-voted suggestions across all media
- [ ] Genre browsing with scrollable chips
- [ ] Advanced filters (genre, year, sort by)

---

## v1.2 — Intelligence & Graph

The recommendation engine gets smart. Graph-based discovery and AI-powered features.

### Neo4j Graph Recommendations
- [ ] Migrate recommendation data to Neo4j graph database
- [ ] Suggestion chains — multi-hop discovery (A→B→C, surface C on A's page)
- [ ] "Taste clusters" — find users with similar recommendation patterns
- [ ] Path-based discovery ("how are these two movies connected?")
- [ ] Weighted graph traversal (vote count as edge weight)

### AI-Powered Features
- [ ] Vector embeddings for media items (pgvector)
- [ ] "More like this" powered by content similarity, not just user votes
- [ ] AI-generated "why you'll like this" summaries for suggestions
- [ ] Natural language search ("dark sci-fi movies like Blade Runner but slower")

### Notifications
- [ ] In-app notification center
- [ ] Someone upvoted your suggestion
- [ ] Someone marked your review as helpful
- [ ] New suggestions on media in your watchlist
- [ ] Email digest (weekly, configurable)

### Social Features
- [ ] Follow other users
- [ ] Activity feed from followed users
- [ ] Share lists and reviews

---

## v1.3 — Platform & Ecosystem

Expanding beyond the core web app.

### PWA (Progressive Web App)
- [ ] Installable on mobile and desktop
- [ ] Offline access to personal lists and cached media pages
- [ ] Push notifications

### Import / Export
- [ ] Import watchlists from Letterboxd, IMDB, Trakt
- [ ] Export personal data (GDPR-friendly)
- [ ] CSV/JSON export for lists and reviews

### Collaborative Features
- [ ] Shared watchlists (invite friends, jointly manage a list)
- [ ] "Watch together" scheduling (pick a time, notify participants)
- [ ] Group recommendations (combine taste profiles of multiple users)

### Public API
- [ ] REST API for developers
- [ ] API key management
- [ ] Rate limiting and usage dashboard

### Browser Extension
- [ ] "Find on Kristin" button on IMDB, Netflix, and other streaming sites
- [ ] Quick-add to watchlist from any page
- [ ] See community rating overlay

---

## v2.0 — Multi-Media Expansion

Expand beyond movies and TV.

### Books
- [ ] Google Books API / Open Library integration
- [ ] Book detail pages, reviews, community recommendations
- [ ] Cross-media suggestions ("if you liked the movie, read the book")

### Video Games
- [ ] RAWG API integration
- [ ] Game detail pages, reviews, community recommendations
- [ ] Platform-aware filtering (PC, PlayStation, Xbox, Switch)

### Music (Exploratory)
- [ ] Spotify/MusicBrainz integration
- [ ] Album/artist pages with community recommendations
- [ ] Mood-based playlists tied to media ("soundtrack vibes")

### Podcasts (Exploratory)
- [ ] Podcast directory integration
- [ ] Episode recommendations tied to media topics

---

## v3.0 — Native Mobile App

Bring the full Kristin experience to iOS and Android.

### React Native App
- [ ] React Native (Expo) project setup with shared TypeScript types
- [ ] Authentication (Supabase Auth with deep linking)
- [ ] Search, browse, and media detail screens
- [ ] Community recommendations — suggest and vote natively
- [ ] Personal lists and reviews
- [ ] Push notifications (vote on your suggestion, new recs on watchlist items)
- [ ] Offline mode (cached lists, recently viewed media)
- [ ] Haptic feedback on votes and interactions
- [ ] Native share sheets (share media pages, reviews)
- [ ] App Store and Google Play deployment

### Shared Infrastructure
- [ ] Shared API layer between web and mobile (same Supabase backend)
- [ ] Shared TypeScript types package (monorepo or published package)
- [ ] Shared validation schemas (Zod)
- [ ] Unified notification system (web + mobile push)

---

## Ongoing — Quality & Polish

These are continuous efforts, not tied to a specific release.

### Performance
- [ ] Lighthouse scores 90+ across all categories
- [ ] ISR for popular media pages
- [ ] Client-side caching (SWR/React Query)
- [ ] TMDB cache TTL cleanup (scheduled)
- [ ] Dynamic imports for heavy components

### Accessibility
- [ ] Full keyboard navigation
- [ ] Screen reader support (ARIA labels, focus management)
- [ ] `prefers-reduced-motion` support
- [ ] WCAG 2.1 AA color contrast compliance

### SEO
- [ ] JSON-LD structured data (Schema.org)
- [ ] Dynamic sitemap generation
- [ ] Canonical URLs
- [ ] robots.txt

### Animations
- [ ] Page transitions
- [ ] Card hover/entrance animations
- [ ] Vote button spring animations
- [ ] Modal enter/exit transitions
- [ ] Skeleton loading states

### Security
- [ ] RLS policies verified on all tables
- [ ] API key protection (server-only)
- [ ] Rate limiting on server actions
- [ ] Input sanitization
- [ ] CSRF protection
