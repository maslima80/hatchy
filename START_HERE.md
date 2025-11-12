# 👋 START HERE - Phase 8 Continuation

## 📍 Current Situation

You're continuing **Phase 8: Product Manager v2** for Hatchy (a marketplace platform).

**Previous assistant completed:**
- ✅ Designed new database schema
- ✅ Created migration files
- ✅ Wrote documentation

**Previous assistant did NOT complete:**
- ❌ Running the migration (database still has old tables)
- ❌ Building server utilities
- ❌ Building UI components

## 🎯 Your Mission

Implement Phase 8 Product Manager v2 with:
- Categories and Tags system
- Product variants with media
- Per-store pricing with locale support (comma decimals)
- Multi-tenancy security
- Soft deletes

## 📚 Read These Files First

**Priority 1 (Must Read):**
1. **`PHASE_8_QUICKSTART.md`** ← Step-by-step checklist (start here!)
2. **`PHASE_8_HANDOFF.md`** ← Complete context and details

**Priority 2 (Reference):**
3. `PHASE_8_MIGRATION_PLAN.md` - Migration strategy
4. `PHASE_8_STATUS.md` - What's done/not done
5. `lib/db/schema.ts` - New schema (source of truth)

## 🚀 Quick Start (3 Steps)

### Step 1: Run Migration
```bash
cd /Users/marciolima/Projects/hatchy
pnpm drizzle-kit push
# Confirm data loss when prompted
```

### Step 2: Verify Migration
```bash
pnpm drizzle-kit studio
# Check that products_v2, variants, categories, tags tables exist
```

### Step 3: Start Building
Follow **PHASE_8_QUICKSTART.md** step-by-step.

## 🎓 Key Context

**Project:** Hatchy - Marketplace platform (like Gumroad)
**Stack:** Next.js 15, Drizzle ORM, PostgreSQL, Stripe
**Phase:** 8 of 10 (Product Manager v2)

**What works now:**
- Authentication & onboarding
- Store builder (Hotsite & Mini-Store)
- Checkout & orders
- Stripe Connect payouts

**What you're building:**
- Advanced product management
- Categories & tags
- Variant system
- Per-store pricing
- Media gallery

## ⚠️ Critical Requirements

1. **Multi-tenancy** - All queries MUST filter by `userId`
2. **Soft deletes** - All queries MUST check `deletedAt IS NULL`
3. **Price validation** - Cannot set VISIBLE if price <= 0
4. **Locale support** - Input "12,34" must store as 1234 cents
5. **Security** - Use `assertBelongsToUser()` in all mutations

## 📁 Project Structure

```
/Users/marciolima/Projects/hatchy/

Key files:
  lib/db/schema.ts ← NEW SCHEMA (v2)
  drizzle/manual_0009_phase8_rebuild.sql ← MIGRATION TO RUN
  
Files to create:
  lib/products.ts ← Server utilities
  lib/variants.ts
  lib/categories.ts
  lib/tags.ts
  
Files to update:
  lib/pricing.ts ← Update getStorefrontPrice()
  lib/checkout.ts ← Update queries
  app/dashboard/products/page.tsx ← Rebuild
  app/dashboard/products/[id]/page.tsx ← Rebuild
```

## 🎯 Success Criteria

You're done when:
- [ ] Migration runs successfully
- [ ] Can create product with 2 variants
- [ ] Can add categories and tags
- [ ] Can attach product to store
- [ ] Can set price: "12,34" → stores as 1234 cents
- [ ] Cannot set VISIBLE with price 0
- [ ] Public page shows product correctly
- [ ] Checkout works
- [ ] Multi-tenancy enforced

## 💬 First Message to User

Ask:
1. "Has the migration run successfully?"
2. "Can you access Drizzle Studio to verify the new tables exist?"
3. "Any specific features you want to prioritize?"

## 🆘 If Something's Unclear

**Check these files:**
- `PHASE_8_HANDOFF.md` - Most detailed context
- `PHASE_8_QUICKSTART.md` - Step-by-step guide
- `lib/db/schema.ts` - Schema structure

**Ask user:**
- "Can you show me the current state of [X]?"
- "What error are you seeing?"
- "Can you run this command and share the output?"

## ⏱️ Time Estimate

- Migration: 5 min
- Server utilities: 2 hours
- Update existing: 1 hour  
- Product List UI: 1 hour
- Product Editor UI: 2 hours
- Pricing page: 30 min
- Storefront: 30 min
- Testing: 1 hour

**Total: ~8 hours**

## 🎬 Action Plan

1. **Read** `PHASE_8_QUICKSTART.md` (5 min)
2. **Run** migration (5 min)
3. **Build** server utilities (2 hours)
4. **Update** existing code (1 hour)
5. **Build** UI components (3.5 hours)
6. **Test** everything (1 hour)

---

**Start by reading `PHASE_8_QUICKSTART.md` and running the migration!**

**Good luck!** 🚀

---

## 📞 Quick Reference

**User:** Marcio Lima
**Project Path:** `/Users/marciolima/Projects/hatchy`
**Database:** PostgreSQL (via DATABASE_URL in .env)
**Package Manager:** pnpm
**Framework:** Next.js 15 App Router

**Helpful Commands:**
```bash
pnpm drizzle-kit push      # Run migration
pnpm drizzle-kit studio    # View database
pnpm dev                   # Start dev server
pnpm run db:push          # Alternative migration
```
