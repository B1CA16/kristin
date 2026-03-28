# Contributing to Kristin

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier)
- A [TMDB API key](https://developer.themoviedb.org) (free)

## Setup

1. Fork and clone the repo
2. Install dependencies: `pnpm install`
3. Copy `.env.local.example` to `.env.local` and fill in your keys
4. Apply database migrations: `supabase db push`
5. Start the dev server: `pnpm dev`

## Development Workflow

### Branching

- All work happens on feature branches off `main`
- Branch naming: `feat/description`, `fix/description`, `chore/description`
- Create a PR to merge into `main`
- CI must pass before merging

### Before Submitting a PR

Run the full check suite locally:

```bash
pnpm check
```

This runs lint, format check, typecheck, tests, and build. Fix any issues before pushing.

### Code Style

- **TypeScript strict mode** — no `any` types unless unavoidable
- **Server Components by default** — only add `'use client'` when needed
- **Server Actions for mutations** — API routes only for TMDB proxy
- **Named exports** over default exports (except Next.js pages)
- **`cn()` utility** for conditional Tailwind classes
- **No hardcoded strings** — all user-facing text goes through `next-intl`

### File Naming

- Components: `kebab-case.tsx` (e.g., `media-card.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-debounce.ts`)
- Server Actions: `kebab-case.ts` grouped by domain

### Translations

If you add user-facing text, add the key to all 4 locale files:

- `src/messages/en.json`
- `src/messages/pt.json`
- `src/messages/es.json`
- `src/messages/fr.json`

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new feature
fix(scope): fix a bug
refactor(scope): code restructuring
chore(scope): maintenance tasks
style(scope): visual/UI changes
```

## Project Structure

See `README.md` for the full project structure.

## Need Help?

Open an issue describing what you want to work on before starting large changes. This helps avoid duplicate work and ensures your contribution aligns with the project direction.
