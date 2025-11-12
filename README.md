# 🐣 Hatchy
Launch your next idea in minutes. Add a product, pick a template, publish a micro-store or hotsite, and sell with Stripe — no code.

## 🚀 What is Hatchy?
Hatchy is a multi-store product launcher. One account → unlimited micro-stores, each with its own domain and pricing. Funds go straight to creators via Stripe Connect; we charge subscription only.

## ✨ Current Status
- ✅ Phase 0: Repo + Next.js 15 + Neon + Drizzle scaffold
- ✅ Phase 1: Public landing page (CTA → /signup)
- ✅ Phase 2: Auth, onboarding, dashboard
  - NextAuth with email/password credentials
  - 2-step user-focused onboarding (Personal Info, Review)
  - Dashboard with sidebar navigation
  - Empty states for Products, Stores, Orders, Settings
  - Auth guards and session management
- ✅ Phase 3: Product Manager MVP
  - Full CRUD for products (Create, Read, Update, Delete, Duplicate)
  - Product types: POD, Dropship, Own Inventory
  - Conditional fields based on product type
  - Inline variant management with SKU, options, cost, price
  - Draft/Ready status toggle
  - Products list with table view
  - Server actions for all operations
  - Toast notifications
- ✅ Phase 4: Store Builder
  - Create stores with 2-step wizard (Details + Products)
  - Store types: Hotsite (single product) & Mini-Store (multiple products)
  - Product picker with search and reordering
  - Public preview pages at /s/{slug}
  - Hotsite template: Hero + single product showcase
  - Mini-Store template: Hero + product grid
  - Draft/Live status toggle
  - Store cards grid with View/Edit/Delete actions
- ✅ Phase 5: Per-Store Pricing
  - Pricebook system with per-store price overrides
  - Inline price editing with save/reset
  - Visibility control (Visible/Hidden/Scheduled)
  - Schedule sales with start/end dates
  - Compare-at pricing for sale badges
  - Bulk actions (hide/show, adjust prices by %)
  - Public pages use pricebook with schedule filtering
  - Auto-inherit from product defaults
- ✅ Phase 6: Stripe Connect
  - Express account onboarding flow
  - Payout accounts table with status tracking
  - Three-state UI (not connected, incomplete, connected)
  - Resume onboarding for incomplete setups
  - Express dashboard login link
  - Webhook handler for account.updated events
  - Status badges (details_submitted, charges_enabled, payouts_enabled)
  - Country support validation
- ✅ Phase 7: Checkout & Orders (COMPLETE)
  - Stripe Checkout in connected accounts
  - Buy buttons on public store pages (Hotsite & Mini-Store)
  - Orders and pending_orders tables
  - Checkout API route with validation
  - Webhook handler for checkout.session.completed
  - Orders dashboard with table view
  - Order detail page with full information
  - Automatic order creation from webhooks
  - Visibility-based buy button rendering
- ⏳ Phase 8 (next): Polish & Launch Prep

## 🧱 Tech Stack
- **Frontend:** Next.js 15 (App Router), React Server Components, Tailwind/shadcn (optional)
- **DB:** Neon (PostgreSQL) + Drizzle ORM (migrations)
- **Auth:** NextAuth.js (email/password first)
- **Payments:** Stripe Connect (Express) — planned
- **Hosting:** Vercel (preview + production)
- **Media (later):** ImageKit or Bunny

## 📁 Project Structure (high level)
/app
/(marketing) # landing pages (home, pricing, faq)
/(auth) # sign in/up, email verify (Phase 2)
/dashboard # shell + pages (Phase 2)
/api # webhooks & server routes
/components # UI components
/lib # helpers (stripe, auth, db)
/db
/schema # drizzle schemas
/migrations # generated migrations
public # static assets


## ⚙️ Environment Variables
Create `.env.local`:

Database

DATABASE_URL=postgres://...

NextAuth

NEXTAUTH_URL=http://localhost:3000

NEXTAUTH_SECRET=replace-with-openssl-rand

Email (Phase 2, optional)

EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=no-reply@hatchy.app

Stripe (Phase 5+)

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_CLIENT_ID=


## 🏃 Getting Started
```bash
# 1) Install deps
pnpm install

# 2) Generate / push DB (Drizzle)
pnpm drizzle:generate
pnpm drizzle:push

# 3) Dev server
pnpm dev
# open http://localhost:3000

🧭 Roadmap (MVP)

Phase 1 (done): Landing with CTA
Phase 2: Auth + onboarding + dashboard shell

NextAuth (credentials)

First-run wizard: name, country/currency, brand color/logo (optional)

Dashboard empty state with “Add Product” / “Create Store”

Phase 3: Product Manager (POD/Dropship/Own — manual MVP)

Create product: title, description, images, variants, cost/price, tags

Status: draft/ready

Phase 4: Create Store / Page (Surfaces)

Wizard: store type (Hotsite / Mini-Store / Link-in-Bio)

Pick products, simple copy fields (headline, bullets, FAQ)

Public preview URL

Phase 5: Stripe “Wallet” (Connect)

Express onboarding + status badge

Basic Stripe portal link

Phase 6: Pricebook per store

Override prices per product/variant per store

Visibility (live/hidden/scheduled)

Phase 7: Domains & SSL

Free subdomain + “Connect your domain” (CNAME) flow

Status: pending/verified + auto SSL

Phase 8: Checkout & Orders

Stripe Checkout, webhooks → Orders

Orders list + detail + manual fulfillment notes/tracking

Phase 9: Dashboard polish + Analytics lite

Rev (7/30d), orders, top products

Per-product/store views & conversion basics

✅ Definition of Done (MVP)

A new user can:

Sign up → finish onboarding

Add a product with variants

Create a store and publish to subdomain

Connect Stripe (optional until Phase 5)

Take a real payment (Phase 8)

See the order and mark fulfilled

🧪 Scripts
pnpm dev              # start dev server
pnpm build            # production build
pnpm start            # run production
pnpm lint             # lint
pnpm drizzle:generate # generate migrations
pnpm drizzle:push     # apply migrations

🔒 Policies (MVP)

No auto-ordering for dropship products.

Seller affirms IP ownership; report/takedown flow.

Restricted items blocked at UI.

📣 Support

Issues → GitHub Issues. Roadmap tweaks via PRs welcome.