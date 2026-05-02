# Local Ecommerce — Product Requirements Document

> A self-contained, fully local ecommerce web application. No cloud services required.
> All data lives in a local SQLite file. Stripe runs in test mode against the local server.

**Last updated:** 2026-05-02 (Phase 2 complete)
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

| Layer      | Choice                                | Version  | Why                                                                                                                                               |
| ---------- | ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | Next.js (App Router)                  | `16.2.4` | Latest stable; React Server Components, Server Actions, Turbopack                                                                                 |
| UI runtime | React + React DOM                     | `19.2.5` | Required peer of Next 16; Server Components, `useFormState`, `useOptimistic`                                                                      |
| Language   | TypeScript                            | `5.9.x`  | Pinning 5.9 over the brand-new 6.0.3 — ecosystem (shadcn, RHF, Drizzle devDeps) is still on 5.x. Bump after a few months once tooling catches up. |
| Styling    | Tailwind CSS + `@tailwindcss/postcss` | `4.2.4`  | CSS-first config via `@theme`; no `tailwind.config.js` needed                                                                                     |
| Components | shadcn/ui CLI                         | `4.6.0`  | Radix-based, copy-paste primitives, full Tailwind v4 compat                                                                                       |
| Icons      | lucide-react                          | `1.14.0` | shadcn default                                                                                                                                    |
| Theming    | next-themes                           | `0.4.6`  | Light/dark mode toggle                                                                                                                            |
| Toasts     | sonner                                | `2.0.7`  | shadcn-recommended toast library                                                                                                                  |

### Data

| Layer      | Choice                           | Version   | Why                                                                              |
| ---------- | -------------------------------- | --------- | -------------------------------------------------------------------------------- |
| Database   | SQLite (file) via better-sqlite3 | `12.9.0`  | Zero infrastructure, single file, fast synchronous driver — ideal for local-only |
| ORM        | Drizzle ORM                      | `0.45.2`  | Strong TS inference, lean runtime, first-class SQLite support                    |
| Migrations | drizzle-kit                      | `0.31.10` | `drizzle-kit generate` + `migrate` workflow                                      |

### Auth & Payments

| Layer    | Choice                            | Version            | Why                                                                                             |
| -------- | --------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| Auth     | Better Auth + Drizzle adapter     | `1.6.9`            | Native Next 16 + Drizzle support; runs entirely local; email/password + sessions out of the box |
| Payments | stripe (Node) + @stripe/stripe-js | `22.1.0` / `9.4.0` | Stripe Elements with **test keys** works fully offline against `stripe listen` for webhooks     |

### Forms / state / images

| Layer            | Choice                              | Version  |
| ---------------- | ----------------------------------- | -------- |
| Form state       | react-hook-form                     | `7.74.0` |
| Validation       | zod (v4)                            | `4.4.1`  |
| Cart store       | zustand (with `persist` middleware) | `5.0.12` |
| Image processing | sharp (transitive via Next image)   | `0.34.5` |

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

| Table              | Purpose                               | Key columns                                                                                                                                                                     |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`            | Better Auth users                     | `id`, `email`, `name`, `email_verified`, `image`, `role` (`customer`/`admin`), timestamps                                                                                       |
| `sessions`         | Better Auth sessions                  | `id`, `user_id`, `expires_at`, `token`, `ip_address`, `user_agent`                                                                                                              |
| `accounts`         | Better Auth OAuth accounts (future)   | `id`, `user_id`, `provider`, `provider_account_id`, ...                                                                                                                         |
| `verifications`    | Better Auth email verification tokens | `id`, `identifier`, `value`, `expires_at`                                                                                                                                       |
| `categories`       | Product categories                    | `id`, `slug`, `name`, `description`, `image_url`, `parent_id` (self-fk, nullable)                                                                                               |
| `products`         | Catalog item                          | `id`, `slug`, `name`, `description`, `price_cents`, `currency`, `category_id`, `inventory`, `is_published`, `created_at`                                                        |
| `product_images`   | Multiple images per product           | `id`, `product_id`, `url`, `alt`, `position`                                                                                                                                    |
| `product_variants` | Optional size/color variants          | `id`, `product_id`, `name`, `sku`, `price_cents`, `inventory`                                                                                                                   |
| `addresses`        | User saved addresses                  | `id`, `user_id`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`, `is_default`                                                                                      |
| `carts`            | Persistent cart for logged-in users   | `id`, `user_id`, `created_at`, `updated_at`                                                                                                                                     |
| `cart_items`       | Cart line items                       | `id`, `cart_id`, `product_id`, `variant_id`, `quantity`                                                                                                                         |
| `orders`           | Placed orders                         | `id`, `user_id` (nullable for guest), `status`, `subtotal_cents`, `tax_cents`, `shipping_cents`, `total_cents`, `stripe_payment_intent_id`, `shipping_address_id`, `created_at` |
| `order_items`      | Order line items (snapshot prices)    | `id`, `order_id`, `product_id`, `variant_id`, `name_snapshot`, `price_cents_snapshot`, `quantity`                                                                               |

**Indexes:** unique on `users.email`, `categories.slug`, `products.slug`; non-unique on `products.category_id`, `orders.user_id`, `orders.status`.

**Search:** SQLite **FTS5** virtual table over `products(name, description)` for fast keyword search. Created in a migration; kept in sync via triggers.

---

## 5. Phased Delivery Plan

Each phase ends with a runnable, demoable state. Estimated effort assumes one engineer working serially.

### Phase 0 — Repo Hygiene & Tooling (~30 min) ✅ Completed 2026-04-30

- [x] `.gitignore` covers `node_modules`, `.next`, `data/app.db*`, `public/uploads/*`, `.env*`
- [x] Decide package manager (pnpm recommended) and commit lockfile — pnpm 10.28.0 pinned via `packageManager`; `pnpm-lock.yaml` committed
- [x] Add `.editorconfig`, `.prettierrc`, `.nvmrc` (Node 20.9+) — `.nvmrc` set to `20.19.3`
- [x] Wire `simple-git-hooks` + `lint-staged` for pre-commit Prettier + ESLint --fix — Prettier hook live now; ESLint `--fix` step will be added to `lint-staged` in Phase 1 once `create-next-app` installs ESLint
- [x] Stub `.env.local.example` with placeholders (no real secrets)
- [x] Bonus: `.prettierignore` added to keep `format:check` from scanning `node_modules`, lockfile, build artifacts

**Phase 0 devDependencies installed:** `prettier@3.8.3`, `prettier-plugin-tailwindcss@0.6.14`, `simple-git-hooks@2.13.1`, `lint-staged@16.4.0`.

**Exit criteria:** `git status` clean; `pnpm format` and `pnpm lint` both pass on an empty repo. _(`pnpm format` passes; `pnpm lint` script lands in Phase 1 with the Next.js ESLint config.)_

---

### Phase 1 — Foundation: Next 16 + Tailwind v4 + shadcn (~1–2 h) ✅ Completed 2026-04-30

- [x] ~~`pnpm dlx create-next-app@latest .`~~ — Skipped: Phase 0 had already populated the repo with `package.json`, prettier config, git hooks, etc. Scaffolded manually instead to avoid clobbering existing tooling
- [x] Verify `next@16.2.4`, `react@19.2.5`, `react-dom@19.2.5` in `package.json`
- [x] Pin TypeScript to `5.9.x` (resolved to `5.9.3`)
- [x] Tailwind v4 installed: `tailwindcss@4.2.4`, `@tailwindcss/postcss@4.2.4`, `postcss`
- [x] `postcss.config.mjs` exports `{ plugins: { '@tailwindcss/postcss': {} } }`
- [x] `app/globals.css`: `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@theme` design tokens, full shadcn neutral palette light + dark, `--font-sans` mapped to a system font stack
- [x] Init shadcn 4.6.0 (`--yes --defaults --force`); `components.json` configured with `baseColor: neutral`, `cssVariables: true`, `tsx: true`. Style is `base-nova` (built on `@base-ui/react`, not Radix — primitives use a `render` prop instead of `asChild`)
- [x] Added shadcn primitives: `button card input label dropdown-menu sheet dialog skeleton badge separator form`. **Note:** shadcn 4.x dropped its own `toast` primitive — toasts now come from `sonner`. The `form` primitive returned an empty registry item from `base-nova`, so it was hand-authored from the canonical default-style form
- [x] Installed `lucide-react@1.14.0`, `next-themes@0.4.6`, `sonner@2.0.7`
- [x] Built `app/layout.tsx`: `<ThemeProvider>` (next-themes, class strategy, system default, `disableTransitionOnChange`), `<Toaster richColors position="top-right" />`, `<Header />`, `<main>`, `<Footer />`. `suppressHydrationWarning` on `<html>`. Metadata exported
- [x] Built `components/site/header.tsx`: sticky top, brand link, desktop nav (Home / Products / Categories), search form (GETs `/products?q=`), CSS-driven Sun/Moon theme toggle (no `useEffect` mounted-gate — uses `dark:hidden`/`dark:block` to satisfy React 19's `react-hooks/set-state-in-effect` rule), cart icon with badge, account dropdown (Sign in / Sign up / My orders / Profile), mobile `<Sheet>` hamburger menu
- [x] Built `components/site/footer.tsx`: 4-column server-component grid (Brand / Shop / Account / About), separator, copyright + "Test mode" notice
- [x] Built `app/page.tsx`: hero (Phase-1 badge, headline, description, "Browse products" CTA, "Try a toast" client-component button) and 3-card feature grid (Real catalog / Local cart & checkout / Admin dashboard)
- [x] `package.json` scripts: `dev`, `build`, `start`, `lint` (ESLint flat config — Next 16 dropped the `next lint` subcommand), `typecheck`. `lint-staged` extended to run `eslint --fix` on `.{ts,tsx,js,jsx,mjs,cjs}` (was deferred from Phase 0)
- [x] `.gitignore` already covered `.next/`, `out/`, `next-env.d.ts`

**Phase 1 dependencies installed (alongside transitive deps):** `next@16.2.4`, `react@19.2.5`, `react-dom@19.2.5`, `lucide-react@1.14.0`, `next-themes@0.4.6`, `sonner@2.0.7`, `react-hook-form@7.74.0`, `@hookform/resolvers@3.10.0`, `zod@3.25.76`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `@base-ui/react`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `shadcn` (CLI). Dev: `typescript@5.9.3`, `@types/node`, `@types/react@19.2.x`, `@types/react-dom@19.2.x`, `tailwindcss@4.2.4`, `@tailwindcss/postcss@4.2.4`, `postcss`, `eslint@9.x`, `eslint-config-next@16.2.4`.

**Phase 1 deviations:**

- **No Google Fonts.** PRD §1 says "no cloud services required" — `next/font/google` does a build-time fetch from Google. Replaced Geist with a system font stack mapped to `--font-sans` in `globals.css`.
- **shadcn primitives use `@base-ui/react`** (Base UI's `render` prop) instead of Radix's `asChild`. This is the `base-nova` style's design and is consistent across all primitives. UI code follows the project pattern (e.g. `<Button render={<Link href="/products" />}>…</Button>`).
- **Project-local pnpm store** pinned via `.npmrc` (`store-dir=./.pnpm-store`) so shadcn's nested `pnpm add` calls share the same store as the rest of the workspace.

**Exit criteria:** ✅ `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass clean. Static prerender of `/` and `/_not-found` succeeds (3 routes). Dev server (`pnpm dev`) renders a styled home page with the dark-mode toggle and toast button.

---

### Phase 2 — Database & Schema (~2–3 h) ✅ Completed 2026-05-02

- [x] Install: `pnpm add drizzle-orm@0.45.2 better-sqlite3@12.9.0`
- [x] Install dev: `pnpm add -D drizzle-kit@0.31.10 @types/better-sqlite3 tsx`
- [x] Create `data/` directory; gitignore the `.db` files (sidecars `.db-journal`, `.db-wal`, `.db-shm` already covered in Phase 0)
- [x] `drizzle.config.ts`: dialect `sqlite`, schema `./lib/db/schema.ts`, out `./data/migrations`, dbCredentials reads `DATABASE_URL` (strips `file:` prefix), falls back to `./data/app.db`
- [x] `lib/db/index.ts`: singleton Drizzle client wrapping a `better-sqlite3` connection. `globalThis` cache for hot-reload safety. `journal_mode = WAL` and `foreign_keys = ON` enabled at connection time. Re-exports `* from './schema'`
- [x] `lib/db/schema.ts`: 13 tables from §4 — `users`, `sessions`, `accounts`, `verifications` (Better Auth shape), `categories`, `products`, `productImages`, `productVariants`, `addresses`, `carts`, `cartItems`, `orders`, `orderItems`. Camel-case TS identifiers map to snake_case SQL columns. UUID primary keys via `crypto.randomUUID()` `$defaultFn`. Booleans use `integer({ mode: 'boolean' })`; timestamps use `integer({ mode: 'timestamp' })` with `$defaultFn(() => new Date())` and `$onUpdateFn` on `updated_at`. Self-FK on `categories.parentId` uses the `(): AnySQLiteColumn` pattern to break the type cycle. Indexes: unique on `users.email`, `categories.slug`, `products.slug`, `sessions.token`, `carts.userId`, `orders.stripePaymentIntentId`; named non-unique on `products.category_id`, `orders.user_id`, `orders.status`. Each table also exports `Type` / `NewType` from `$inferSelect` / `$inferInsert` (26 type exports total)
- [x] Generated first migration: `pnpm db:generate` produced `data/migrations/0000_shallow_vanisher.sql` covering all 13 tables. Applied via `pnpm db:migrate` (custom tsx runner at `lib/db/migrate.ts` — opens its own better-sqlite3 connection, no `'server-only'` import)
- [x] Hand-authored FTS5 migration: `data/migrations/0001_products_fts.sql` creates `products_fts` virtual table over `products(name, description)` with `tokenize='porter unicode61'`, plus `products_fts_ai` / `products_fts_ad` / `products_fts_au` sync triggers. Manually appended an entry to `data/migrations/meta/_journal.json` (drizzle-kit's migrator reads the journal in order and runs the `.sql` files; the snapshot file was duplicated as `0001_snapshot.json` so future `db:generate` runs continue cleanly)
- [x] `lib/db/seed.ts`: idempotent — wraps everything in a synchronous `db.transaction` (better-sqlite3 transactions are synchronous), deletes in reverse-FK order then inserts: 5 categories (Apparel / Footwear / Accessories / Home Goods / Electronics), 25 products (5 per category, 2 left unpublished for admin testing), 25 `product_images` rows pointing at local SVG placeholders, 9 size variants (S/M/L) across 3 apparel products, 2 users (`admin@local.test` role `admin`, `customer@local.test` role `customer`). Better Auth credential rows are intentionally deferred to Phase 3
- [x] 30 SVG placeholder images committed at `public/uploads/seed/` (5 category + 25 product, 600×600, system font, color-coded per category) so the storefront has real-looking imagery without external deps. `public/uploads/seed/.gitkeep` ensures the dir is tracked
- [x] `package.json` scripts added: `db:generate` (drizzle-kit), `db:migrate` (tsx runner), `db:studio` (drizzle-kit), `db:seed` (tsx), `db:reset` (tsx — deletes `app.db` + sidecars then shells `db:migrate` then `db:seed`)
- [x] **Bonus:** `.npmrc` migrated from `only-built-dependencies="[\"...\"]"` (which pnpm 10 didn't honor) to YAML-array form (`only-built-dependencies[]=better-sqlite3` etc.) so the better-sqlite3 native binding compiles automatically on `pnpm install`. Covers `better-sqlite3`, `sharp`, `esbuild`, `simple-git-hooks`, `unrs-resolver`, `msw`

**Phase 2 dependencies installed:** `drizzle-orm@0.45.2`, `better-sqlite3@12.9.0`. Dev: `drizzle-kit@0.31.10`, `@types/better-sqlite3@7.6.13`, `tsx@4.21.0`.

**Phase 2 deviations:**

- **`lib/db/index.ts` does not import `'server-only'`** (the package isn't installed). Replaced with a comment marker. If we later install `server-only` (zero-cost helper), swap the comment back to `import 'server-only';`.
- **`db:reset` requires writable Unix-domain socket** for `tsx`'s IPC. In a sandboxed shell (e.g. Claude Code's default mode), `tsx` will fail with `EPERM ... .pipe`. Outside the sandbox (or in a normal terminal) it runs cleanly — documented for the README in Phase 8.

**Exit criteria:** ✅ `pnpm db:reset` builds a fresh `data/app.db` (44 KB) populated with 5 categories, 25 products, 25 images, 9 variants, 2 users. The `products_fts` MATCH query returns hits (`MATCH 'shirt'` → 2 rows). `pnpm db:studio` is wired and ready (not exercised in this phase since it opens a browser UI).

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

| Risk                                                  | Mitigation                                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `better-sqlite3` native build fails on `pnpm install` | Document Node 20.9+ requirement; if Node ABI mismatch, suggest `pnpm rebuild better-sqlite3`                                                                          |
| Tailwind v4 + shadcn token mismatches                 | shadcn 4.6.0's `init` already targets v4 — use it instead of hand-wiring                                                                                              |
| Next 16 + React 19 churn breaking a third-party lib   | All chosen libs (Better Auth, RHF, Zustand, lucide, sonner, next-themes) declare React 19 / Next 16 in peers as of this writing                                       |
| Drizzle-kit not auto-generating FTS5 tables           | Hand-author one migration file for FTS5 + triggers; commit it alongside generated ones                                                                                |
| Stripe webhook unreachable from cloud                 | Use `stripe listen --forward-to` — the only thing that "leaves localhost" is the CLI tunnel, and it's optional (orders can be marked paid manually for offline demos) |
| TypeScript 6.0 ecosystem gaps                         | Pin to 5.9.x; revisit in 2–3 months                                                                                                                                   |

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
