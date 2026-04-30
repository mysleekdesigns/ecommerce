# Local Ecommerce — Product Requirements Document

> A self-contained, fully local ecommerce web application. No cloud services required.
> All data lives in a local SQLite file. Stripe runs in test mode against the local server.

**Last updated:** 2026-04-30
**Target environment:** macOS / local development only
**Node runtime:** ≥ 20.9 (required by Next 16 + better-sqlite3 12)

---

## 1. Vision

Build a feature-complete ecommerce website that can be cloned, `npm install`-ed, and run locally with **zero external accounts** beyond an optional Stripe test key. The app should feel like a real production storefront (catalog, cart, auth, checkout, admin) but never depend on a hosted database, hosted auth, or hosted asset store.

### Non-goals (explicitly out of scope for the local build)
- Cloud deployment, CI/CD, domain setup
- Hosted databases (Postgres, Turso, Neon, Supabase, etc.)
- Hosted auth providers (Clerk, Auth0)
- Cloud object storage (S3, R2, Cloudinary). All product images live in `public/uploads/`.
- Real payment capture (Stripe stays in test mode)
- Email delivery (verification/order emails log to console)

---

## 2. Tech Stack (locked versions, verified Apr 30, 2026)

### Core
| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | `16.2.4` | Latest stable; React Server Components, Server Actions, Turbopack |
| UI runtime | React + React DOM | `19.2.5` | Required peer of Next 16; Server Components, `useFormState`, `useOptimistic` |
| Language | TypeScript | `5.9.x` | Pinning 5.9 over the brand-new 6.0.3 — ecosystem (shadcn, RHF, Drizzle devDeps) is still on 5.x. Bump after a few months once tooling catches up. |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | `4.2.4` | CSS-first config via `@theme`; no `tailwind.config.js` needed |
| Components | shadcn/ui CLI | `4.6.0` | Radix-based, copy-paste primitives, full Tailwind v4 compat |
| Icons | lucide-react | `1.14.0` | shadcn default |
| Theming | next-themes | `0.4.6` | Light/dark mode toggle |
| Toasts | sonner | `2.0.7` | shadcn-recommended toast library |

### Data
| Layer | Choice | Version | Why |
|---|---|---|---|
| Database | SQLite (file) via better-sqlite3 | `12.9.0` | Zero infrastructure, single file, fast synchronous driver — ideal for local-only |
| ORM | Drizzle ORM | `0.45.2` | Strong TS inference, lean runtime, first-class SQLite support |
| Migrations | drizzle-kit | `0.31.10` | `drizzle-kit generate` + `migrate` workflow |

### Auth & Payments
| Layer | Choice | Version | Why |
|---|---|---|---|
| Auth | Better Auth + Drizzle adapter | `1.6.9` | Native Next 16 + Drizzle support; runs entirely local; email/password + sessions out of the box |
| Payments | stripe (Node) + @stripe/stripe-js | `22.1.0` / `9.4.0` | Stripe Elements with **test keys** works fully offline against `stripe listen` for webhooks |

### Forms / state / images
| Layer | Choice | Version |
|---|---|---|
| Form state | react-hook-form | `7.74.0` |
| Validation | zod (v4) | `4.4.1` |
| Cart store | zustand (with `persist` middleware) | `5.0.12` |
| Image processing | sharp (transitive via Next image) | `0.34.5` |

### Tooling
- **ESLint** (Next default flat config), **Prettier**, **simple-git-hooks** + **lint-staged** for pre-commit format/lint.
- **pnpm** (recommended) or npm.

---

## 3. High-level Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (Server Components by default)   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ (storefront) │  │   (account)  │  │    /admin    │   │
│  │  RSC pages   │  │  RSC + form  │  │  RSC + form  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │           │
│         └─────── Server Actions ────────────┘           │
│                          │                              │
│                ┌─────────▼──────────┐                   │
│                │  lib/db (Drizzle)  │                   │
│                └─────────┬──────────┘                   │
│                ┌─────────▼──────────┐                   │
│                │  data/app.db       │                   │
│                │  (better-sqlite3)  │                   │
│                └────────────────────┘                   │
│                                                         │
│  Auth: Better Auth handler at /api/auth/[...all]        │
│  Stripe webhook: /api/stripe/webhook (POST)             │
└─────────────────────────────────────────────────────────┘
```

### Directory layout

```
ecommerce/
├── app/
│   ├── (storefront)/            # public, no auth required
│   │   ├── page.tsx             # home
│   │   ├── products/
│   │   │   ├── page.tsx         # listing + filters
│   │   │   └── [slug]/page.tsx  # detail
│   │   ├── categories/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (account)/
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   └── profile/page.tsx
│   ├── admin/
│   │   ├── layout.tsx           # role check + sidebar
│   │   ├── page.tsx             # dashboard summary
│   │   ├── products/...
│   │   ├── categories/...
│   │   └── orders/...
│   ├── api/
│   │   ├── auth/[...all]/route.ts  # Better Auth handler
│   │   └── stripe/webhook/route.ts
│   ├── globals.css              # @import "tailwindcss"; @theme {}
│   └── layout.tsx
├── components/
│   ├── ui/                      # shadcn primitives
│   ├── storefront/              # ProductCard, MiniCart, etc.
│   ├── checkout/
│   └── admin/
├── lib/
│   ├── db/
│   │   ├── index.ts             # drizzle client (singleton)
│   │   ├── schema.ts            # all tables
│   │   └── seed.ts
│   ├── auth.ts                  # better-auth init
│   ├── auth-client.ts           # client-side helpers
│   ├── cart-store.ts            # zustand store
│   ├── stripe.ts                # server stripe client
│   ├── validation/              # zod schemas (per resource)
│   └── utils.ts
├── data/
│   ├── app.db                   # gitignored
│   └── migrations/              # drizzle-kit output
├── public/
│   └── uploads/                 # gitignored, product images
├── drizzle.config.ts
├── middleware.ts                # route protection
├── postcss.config.mjs
├── next.config.ts
├── components.json              # shadcn config
└── PRD.md
```

---

## 4. Data Model (Drizzle schema, SQLite)

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Better Auth users | `id`, `email`, `name`, `email_verified`, `image`, `role` (`customer`/`admin`), timestamps |
| `sessions` | Better Auth sessions | `id`, `user_id`, `expires_at`, `token`, `ip_address`, `user_agent` |
| `accounts` | Better Auth OAuth accounts (future) | `id`, `user_id`, `provider`, `provider_account_id`, ... |
| `verifications` | Better Auth email verification tokens | `id`, `identifier`, `value`, `expires_at` |
| `categories` | Product categories | `id`, `slug`, `name`, `description`, `image_url`, `parent_id` (self-fk, nullable) |
| `products` | Catalog item | `id`, `slug`, `name`, `description`, `price_cents`, `currency`, `category_id`, `inventory`, `is_published`, `created_at` |
| `product_images` | Multiple images per product | `id`, `product_id`, `url`, `alt`, `position` |
| `product_variants` | Optional size/color variants | `id`, `product_id`, `name`, `sku`, `price_cents`, `inventory` |
| `addresses` | User saved addresses | `id`, `user_id`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`, `is_default` |
| `carts` | Persistent cart for logged-in users | `id`, `user_id`, `created_at`, `updated_at` |
| `cart_items` | Cart line items | `id`, `cart_id`, `product_id`, `variant_id`, `quantity` |
| `orders` | Placed orders | `id`, `user_id` (nullable for guest), `status`, `subtotal_cents`, `tax_cents`, `shipping_cents`, `total_cents`, `stripe_payment_intent_id`, `shipping_address_id`, `created_at` |
| `order_items` | Order line items (snapshot prices) | `id`, `order_id`, `product_id`, `variant_id`, `name_snapshot`, `price_cents_snapshot`, `quantity` |

**Indexes:** unique on `users.email`, `categories.slug`, `products.slug`; non-unique on `products.category_id`, `orders.user_id`, `orders.status`.

**Search:** SQLite **FTS5** virtual table over `products(name, description)` for fast keyword search. Created in a migration; kept in sync via triggers.

---

## 5. Phased Delivery Plan

Each phase ends with a runnable, demoable state. Estimated effort assumes one engineer working serially.

### Phase 0 — Repo Hygiene & Tooling (~30 min)

- [ ] `.gitignore` covers `node_modules`, `.next`, `data/app.db*`, `public/uploads/*`, `.env*`
- [ ] Decide package manager (pnpm recommended) and commit lockfile
- [ ] Add `.editorconfig`, `.prettierrc`, `.nvmrc` (Node 20.9+)
- [ ] Wire `simple-git-hooks` + `lint-staged` for pre-commit Prettier + ESLint --fix
- [ ] Stub `.env.local.example` with placeholders (no real secrets)

**Exit criteria:** `git status` clean; `pnpm format` and `pnpm lint` both pass on an empty repo.

---

### Phase 1 — Foundation: Next 16 + Tailwind v4 + shadcn (~1–2 h)

- [ ] `pnpm dlx create-next-app@latest .` → TypeScript, ESLint, App Router, Turbopack, src dir = no, import alias `@/*`
- [ ] Verify `next@16.2.4`, `react@19.2.5`, `react-dom@19.2.5` in `package.json`
- [ ] Pin TypeScript to `5.9.x` (override the create-next-app default if it ships 6.x)
- [ ] Replace default Tailwind setup with v4: `pnpm add -D tailwindcss@4.2.4 @tailwindcss/postcss@4.2.4 postcss`
- [ ] `postcss.config.mjs` exports `{ plugins: { '@tailwindcss/postcss': {} } }`
- [ ] `app/globals.css`: `@import "tailwindcss";` + `@theme { ... }` design tokens (colors, radii, fonts)
- [ ] Init shadcn: `pnpm dlx shadcn@4.6.0 init` — choose Neutral base color, CSS variables ON
- [ ] Add starter primitives: `button card input label dropdown-menu sheet dialog toast skeleton form badge separator`
- [ ] Install `lucide-react@1.14.0`, `next-themes@0.4.6`, `sonner@2.0.7`
- [ ] Build `app/layout.tsx`: `<ThemeProvider>`, `<Toaster />`, root `<header>` (logo, nav, search, cart icon, account dropdown), `<footer>`
- [ ] Build a placeholder home page hero so the dev server renders something real

**Exit criteria:** `pnpm dev` shows a styled home page with working dark-mode toggle and a toast button. No console errors.

---

### Phase 2 — Database & Schema (~2–3 h)

- [ ] Install: `pnpm add drizzle-orm@0.45.2 better-sqlite3@12.9.0`
- [ ] Install dev: `pnpm add -D drizzle-kit@0.31.10 @types/better-sqlite3 tsx`
- [ ] Create `data/` directory; gitignore the `.db` files
- [ ] `drizzle.config.ts`: dialect `sqlite`, schema `./lib/db/schema.ts`, out `./data/migrations`, dbCredentials `./data/app.db`
- [ ] `lib/db/index.ts`: singleton Drizzle client wrapping a better-sqlite3 connection (`globalThis` cache for hot-reload safety)
- [ ] `lib/db/schema.ts`: define all tables from §4. Use `sqliteTable`, `text`, `integer`, `integer({ mode: 'timestamp' })`, foreign keys with `onDelete: 'cascade'` where appropriate
- [ ] Generate first migration: `pnpm drizzle-kit generate`; apply: `pnpm drizzle-kit migrate`
- [ ] Add FTS5 virtual table + triggers in a hand-written migration file (drizzle-kit doesn't generate FTS automatically)
- [ ] `lib/db/seed.ts`: insert ~5 categories, ~25 products with images sourced from `public/uploads/seed/`, 1 admin user, 1 customer user
- [ ] `package.json` scripts: `db:generate`, `db:migrate`, `db:studio`, `db:seed`, `db:reset` (deletes file + re-runs migrate + seed)

**Exit criteria:** `pnpm db:reset` builds a fresh `data/app.db` with seed data. `pnpm db:studio` opens Drizzle Studio and shows the rows.

---

### Phase 3 — Authentication (~2 h)

- [ ] Install: `pnpm add better-auth@1.6.9`
- [ ] `lib/auth.ts`: configure `betterAuth({ database: drizzleAdapter(db, { provider: 'sqlite' }), emailAndPassword: { enabled: true, requireEmailVerification: false }, ... })`
- [ ] `lib/auth-client.ts`: `createAuthClient` for React components
- [ ] Mount handler at `app/api/auth/[...all]/route.ts` using `toNextJsHandler(auth)`
- [ ] Run Better Auth's schema generation; rerun `db:generate` + `db:migrate` so the auth tables match
- [ ] `middleware.ts`: protect `/admin/*` (require `role === 'admin'`) and `/account/*` (require any session). Redirect unauthenticated to `/sign-in?next=...`
- [ ] Build sign-in / sign-up pages with shadcn `<Form>` + react-hook-form + zod
- [ ] Account dropdown in header: shows email + sign-out when authed, sign-in/sign-up links otherwise
- [ ] Email verification: log the verification link to console (no SMTP setup)
- [ ] Manual seed: promote one user to `role = 'admin'`

**Exit criteria:** Can sign up, sign in, sign out. Hitting `/admin` as a non-admin redirects. Hitting `/admin` as the seeded admin loads.

---

### Phase 4 — Product Catalog (~3–4 h)

- [ ] `app/(storefront)/page.tsx`: hero + featured products grid + category tiles (RSC, queries Drizzle directly)
- [ ] `app/(storefront)/products/page.tsx`: paginated listing
  - [ ] Search via FTS5 (`?q=`)
  - [ ] Category filter (`?category=`)
  - [ ] Price range (`?min=&max=`)
  - [ ] Sort: newest / price asc / price desc (`?sort=`)
  - [ ] Server-rendered with searchParams; client component only for the filter sidebar inputs
- [ ] `app/(storefront)/products/[slug]/page.tsx`: image gallery, description, price, variant picker, quantity input, "Add to cart" client component
- [ ] `app/(storefront)/categories/[slug]/page.tsx`: same listing UI, scoped to category
- [ ] Loading + not-found UI: `loading.tsx` skeletons; `not-found.tsx` for missing slugs
- [ ] `next.config.ts`: configure `images.remotePatterns` if external images, otherwise rely on local `/uploads`

**Exit criteria:** Browsing, searching, filtering, sorting all work against the seeded data with no client-side JS for the listing query path.

---

### Phase 5 — Cart (~2–3 h)

- [ ] `lib/cart-store.ts`: Zustand store with `persist` middleware → localStorage. Shape: `{ items: { productId, variantId?, quantity }[] }`
- [ ] Cart hydration guard: render mini-cart count only after hydration to avoid SSR mismatch
- [ ] Mini-cart drawer (shadcn `<Sheet>`) triggered from header cart icon: list, qty steppers, line totals, "Go to checkout"
- [ ] `app/(storefront)/cart/page.tsx`: full cart view, server-rendered shell with client-side line items
- [ ] On sign-in, merge guest localStorage cart → server `carts` row (Server Action)
- [ ] Recalculate stock-aware quantities — block adding more than `inventory`

**Exit criteria:** Add/update/remove works for both guests and authed users. Refresh preserves cart. Signing in merges guest cart.

---

### Phase 6 — Checkout & Orders (~3–4 h)

- [ ] Install: `pnpm add stripe@22.1.0 @stripe/stripe-js@9.4.0 @stripe/react-stripe-js`
- [ ] `lib/stripe.ts`: server Stripe client; reads `STRIPE_SECRET_KEY` (test key)
- [ ] `app/(storefront)/checkout/page.tsx`: shipping address form (RHF + zod), order summary, Stripe `<PaymentElement>`
- [ ] Server Action `createOrder`:
  1. Validate cart against current product prices/inventory
  2. Insert `orders` + `order_items` with status `pending`
  3. Create `PaymentIntent` for `total_cents` and return `client_secret`
- [ ] On payment success (client `confirmPayment` resolves with `succeeded`), redirect to `/checkout/success?order_id=`
- [ ] `app/api/stripe/webhook/route.ts`: verifies signature, on `payment_intent.succeeded` flips order to `paid` and decrements inventory; on `payment_intent.payment_failed` flips order to `failed`
- [ ] Local webhook forwarding via `stripe listen --forward-to localhost:3000/api/stripe/webhook` — document in README
- [ ] `app/(account)/orders/page.tsx`: list of user's orders
- [ ] `app/(account)/orders/[id]/page.tsx`: itemized detail + status

**Exit criteria:** A test card (`4242 4242 4242 4242`) completes a checkout end-to-end, the webhook flips the order to paid, the order shows in account history with correct totals.

---

### Phase 7 — Admin Dashboard (~3–4 h)

- [ ] `app/admin/layout.tsx`: role check (redirect non-admins), sidebar nav
- [ ] `app/admin/page.tsx`: counts (orders today, revenue this week, low-stock products), recent orders list
- [ ] **Products CRUD**
  - [ ] List with search + pagination
  - [ ] Create / edit form (RHF + zod, shadcn primitives)
  - [ ] Image upload Server Action: writes to `public/uploads/products/<id>/<filename>` (validate mime, size cap, sanitize filename); store relative URL in `product_images`
  - [ ] Soft "publish/unpublish" toggle via `is_published`
  - [ ] Delete with confirm dialog
- [ ] **Categories CRUD** (simpler — name, slug, parent, image)
- [ ] **Orders**
  - [ ] List with status filter
  - [ ] Detail view: line items, customer, address, payment status
  - [ ] Update fulfillment status (`pending` → `paid` → `fulfilled` → `delivered`, or `cancelled`)

**Exit criteria:** An admin can fully manage products, categories, and orders from the UI without touching the database.

---

### Phase 8 — Polish & Local QA (~2–3 h)

- [ ] Loading skeletons on every async route
- [ ] Empty states (empty cart, no orders, no products in category)
- [ ] Sonner toasts for: add to cart, sign-in success, order placed, admin save success/error
- [ ] Error boundaries: per-segment `error.tsx`, plus a global `app/global-error.tsx`
- [ ] Mobile responsive pass (375 / 768 / 1280 viewports)
- [ ] A11y pass: keyboard nav of menu/cart/checkout, focus rings, `<Sheet>` and `<Dialog>` aria via Radix defaults, alt text on product images
- [ ] Lighthouse run on home + product detail; target ≥ 90 perf locally
- [ ] `README.md`: prerequisites, install, env, run, seed, Stripe CLI usage, troubleshooting
- [ ] `.env.local.example`: list `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` with safe placeholder values
- [ ] Smoke-test script: `pnpm test:smoke` (optional) — uses `tsx` to hit a few public URLs and assert 200

**Exit criteria:** Fresh `git clone` → `pnpm install` → `pnpm db:reset` → `pnpm dev` produces a working storefront in under 5 minutes following the README.

---

## 6. Environment Variables

Create `.env.local` (gitignored). The `.env.local.example` file in the repo lists these with placeholder values:

```
# Database (relative path, file gets created on first migrate)
DATABASE_URL=file:./data/app.db

# Better Auth — generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=replace-me
BETTER_AUTH_URL=http://localhost:3000

# Stripe (TEST keys only — find them at dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen`
```

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `better-sqlite3` native build fails on `pnpm install` | Document Node 20.9+ requirement; if Node ABI mismatch, suggest `pnpm rebuild better-sqlite3` |
| Tailwind v4 + shadcn token mismatches | shadcn 4.6.0's `init` already targets v4 — use it instead of hand-wiring |
| Next 16 + React 19 churn breaking a third-party lib | All chosen libs (Better Auth, RHF, Zustand, lucide, sonner, next-themes) declare React 19 / Next 16 in peers as of this writing |
| Drizzle-kit not auto-generating FTS5 tables | Hand-author one migration file for FTS5 + triggers; commit it alongside generated ones |
| Stripe webhook unreachable from cloud | Use `stripe listen --forward-to` — the only thing that "leaves localhost" is the CLI tunnel, and it's optional (orders can be marked paid manually for offline demos) |
| TypeScript 6.0 ecosystem gaps | Pin to 5.9.x; revisit in 2–3 months |

---

## 8. Out-of-Scope Future Work (do NOT do during phases 1–8)

These are explicitly deferred — capture them so they don't creep in:

- Cloud database migration (Turso / Postgres)
- Hosting/deploy (Vercel, self-host)
- Email delivery (Resend / SMTP)
- Real OAuth providers (Google, GitHub)
- Analytics, monitoring, error reporting
- i18n, multi-currency, tax engine integration
- Reviews, wishlists, gift cards, promo codes
- Multi-tenant / multi-store
- E2E tests (Playwright) — defer until after Phase 8 if desired

---

## 9. Acceptance Checklist (final demo)

A run-through that proves the build is done:

- [ ] Fresh clone → install → seed → dev server boots cleanly
- [ ] Browse home, listing, category, product detail
- [ ] Search, filter by category, sort by price
- [ ] Add multiple items to cart as guest; refresh; cart persists
- [ ] Sign up, sign in; cart merges
- [ ] Complete checkout with Stripe test card; order created; webhook flips status to paid
- [ ] View order in `/account/orders`
- [ ] Sign in as admin; create / edit / delete a product; upload an image; toggle publish
- [ ] Update an order's fulfillment status from admin
- [ ] Toggle dark/light theme; works on every page
- [ ] Mobile viewport is usable end-to-end
- [ ] No TypeScript errors, no ESLint errors, no console errors during the run-through
