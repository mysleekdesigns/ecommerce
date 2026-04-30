# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This is a **fully local, self-contained ecommerce app** built phase-by-phase against `PRD.md`. The PRD is the source of truth for scope, tech-stack versions, data model, and what is intentionally out of scope. Read it before starting non-trivial work.

Key constraint: **no cloud services**. SQLite file (`data/app.db`), local file uploads (`public/uploads/`), Stripe in test mode only, no hosted auth, no Google Fonts (`next/font/google` was deliberately avoided — system font stack is mapped to `--font-sans` in `app/globals.css`). Don't introduce cloud dependencies.

Phase tracking lives in `PRD.md` §5 — each phase has explicit exit criteria and a checkbox list. As of the latest commit, **Phase 1 (foundation) is complete**; Phase 2 (database) is next.

## Commands

Package manager is **pnpm 10.28.0** (pinned via `packageManager` and `.npmrc` with a project-local store at `./.pnpm-store`). Node ≥ 20.9 (`.nvmrc` = 20.19.3), required by Next 16 and `better-sqlite3` 12.

```bash
pnpm dev          # Next dev server with Turbopack
pnpm build        # production build
pnpm lint         # ESLint flat config (Next 16 dropped `next lint`)
pnpm typecheck    # tsc --noEmit
pnpm format       # prettier --write .
pnpm format:check # prettier --check .
```

Pre-commit hook runs `lint-staged` (eslint --fix + prettier) via `simple-git-hooks`.

Once Phase 2 lands, db scripts will be: `db:generate`, `db:migrate`, `db:studio`, `db:seed`, `db:reset`.

## Architecture

Next.js 16 App Router, RSC-first. Server Components by default; Server Actions for mutations. Drizzle ORM over `better-sqlite3` (singleton client in `lib/db/index.ts`, schema in `lib/db/schema.ts`). Better Auth handler at `app/api/auth/[...all]/route.ts`. Stripe webhook at `app/api/stripe/webhook/route.ts`. Route protection via `middleware.ts` (admin requires `role === 'admin'`, account requires session).

Route groups (per PRD §3): `(storefront)` public, `(auth)` sign-in/up, `(account)` authed user pages, `/admin` admin-only. Path alias `@/*` resolves to repo root.

## shadcn / UI primitives — important gotcha

`components.json` style is **`base-nova`**, which is built on **`@base-ui/react`**, not Radix. This changes how composition works:

- Use the `render` prop, **not** `asChild`. Example: `<Button render={<Link href="/products" />}>Browse</Button>`, `<SheetTrigger render={<Button variant="ghost" size="icon" />}>...</SheetTrigger>`, `<DropdownMenuItem render={<Link href="/sign-in">Sign in</Link>} />`.
- Existing `components/ui/*` follow this pattern — match it when adding shadcn primitives.
- shadcn 4.x dropped its own `toast` primitive; toasts come from `sonner` (`<Toaster />` is mounted in `app/layout.tsx`).
- The `form` primitive's `base-nova` registry was empty — `components/ui/form.tsx` is hand-authored from the canonical default-style form. Don't blindly re-run shadcn add for `form`.

Tailwind is **v4** (CSS-first). There is **no `tailwind.config.js`** — design tokens live in `app/globals.css` via `@theme` / `@theme inline`. `postcss.config.mjs` uses `@tailwindcss/postcss`.

## Conventions

- TypeScript strict mode, pinned to 5.9.x (don't bump to 6.x — ecosystem isn't ready per PRD §7).
- Prefer Server Components; only mark `"use client"` when you need interactivity (theme toggle, cart store, mobile sheet state, etc.).
- Forms: react-hook-form + zod (`@hookform/resolvers`).
- Validation schemas live in `lib/validation/` (per resource), once added.
- Money is stored as `*_cents` integers — never floats.
- Theme toggle uses CSS-driven `dark:hidden` / `dark:block` instead of a mounted-gate `useEffect` (React 19's `react-hooks/set-state-in-effect` rule). See `components/site/header.tsx`.

## Local-only working state

The directories `cache/`, `jobs/`, `snapshots/`, `webhooks/` at the repo root are **local agent/tool working state, not part of the project** — they're gitignored. Don't put product code there.
