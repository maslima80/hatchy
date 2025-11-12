# Phase 8 Quick Start Checklist

## 🎯 Goal
Build Product Manager v2 with categories, tags, variants, and per-store pricing.

## ✅ Pre-Flight Check

**What's Done:**
- [x] New schema designed (`lib/db/schema.ts`)
- [x] Migration SQL created (`drizzle/manual_0009_phase8_rebuild.sql`)
- [x] Documentation written

**What's NOT Done:**
- [ ] Migration has NOT been run yet
- [ ] Database still has old tables
- [ ] No server utilities created
- [ ] No UI components built

## 🚀 Step-by-Step Instructions

### Step 1: Run Migration (5 minutes)

```bash
cd /Users/marciolima/Projects/hatchy

# Run migration
pnpm drizzle-kit push

# When asked about data loss, type: yes

# Verify it worked
pnpm drizzle-kit studio
# Check that these tables exist:
# - products_v2
# - variants
# - categories
# - tags
# - product_categories
# - product_tags
# - product_media
# - external_links
# - store_products_v2
# - store_prices_v2
```

**If migration fails:** Read error, check DATABASE_URL in .env, try manual SQL from `drizzle/manual_0009_phase8_rebuild.sql`

### Step 2: Create Server Utilities (2 hours)

**Priority order:**

1. **`lib/products.ts`** (30 min)
   - getProductsForUser()
   - getProductById()
   - upsertProduct()
   - deleteProduct() // soft delete
   - assertBelongsToUser()

2. **`lib/pricing.ts`** (30 min)
   - Update getStorefrontPrice() for new schema
   - Add setStorePrice()
   - Add canSetVisible()

3. **`lib/variants.ts`** (20 min)
   - upsertVariant()
   - deleteVariant()
   - getProductVariants()

4. **`lib/categories.ts`** (20 min)
   - getUserCategories()
   - upsertCategory()
   - attachCategoriesToProduct()

5. **`lib/tags.ts`** (20 min)
   - getUserTags()
   - upsertTag()
   - attachTagsToProduct()

### Step 3: Update Existing Code (1 hour)

**Files to update (in order):**

1. `/lib/checkout.ts` - Update getStorefrontPrice() (15 min)
2. `/app/actions/stores.ts` - Update store_products queries (15 min)
3. `/app/actions/pricing.ts` - Update store_prices queries (15 min)
4. `/app/api/webhooks/stripe/route.ts` - Remove product_sources (15 min)

**Key changes:**
- Replace `products` → still `products` (but queries products_v2 table)
- Replace `productVariants` → `variants`
- Replace `storeProducts` → still `storeProducts` (but queries store_products_v2)
- Replace `storePrices` → still `storePrices` (but queries store_prices_v2)
- Add `isNull(products.deletedAt)` to all queries
- Add `eq(products.userId, userId)` to all queries

### Step 4: Build Product List (1 hour)

**File:** `/app/dashboard/products/page.tsx`

**Features:**
- Fetch products with `getProductsForUser()`
- Table with: Title, Type, Variants count, Categories, Tags, Status
- Filters: Status, Type, Category, Tag
- Search box
- Bulk actions dropdown
- "New Product" button

**Use existing components:**
- `Card`, `Button`, `Input`, `Select` from `/components/ui`
- Copy table structure from `/app/dashboard/orders/page.tsx`

### Step 5: Build Product Editor (2 hours)

**File:** `/app/dashboard/products/[id]/page.tsx`

**Structure:**
```tsx
<Tabs>
  <Tab label="Basics">
    {/* Title, Description, Type, Status, Image, Categories, Tags */}
  </Tab>
  <Tab label="Variants & Media">
    {/* Variant table, Media gallery */}
  </Tab>
  <Tab label="Publishing">
    {/* Attach to stores, per-store pricing, visibility */}
  </Tab>
</Tabs>
```

**Reuse:**
- Variant table from `/app/dashboard/products/components/VariantTable.tsx`
- Form patterns from existing product form

### Step 6: Update Pricing Page (30 min)

**File:** `/app/dashboard/stores/[id]/pricing/page.tsx`

**Changes:**
- Query `store_products_v2` instead of `store_products`
- Query `store_prices_v2` with new structure
- Add visibility toggle
- Block visibility if price <= 0

### Step 7: Update Storefront (30 min)

**Files:**
- `/app/(public)/s/[slug]/page.tsx`
- `/lib/checkout.ts`

**Changes:**
- Check `visibility = 'VISIBLE'`
- Check `deleted_at IS NULL`
- Use updated `getStorefrontPrice()`

### Step 8: Test Everything (1 hour)

**Test checklist:**
- [ ] Create product with 2 variants
- [ ] Add categories and tags
- [ ] Attach to store
- [ ] Set price: "12,34" → stores as 1234 cents
- [ ] Try to set VISIBLE with price 0 → blocked
- [ ] Set price > 0, set VISIBLE → works
- [ ] Public page shows product
- [ ] Checkout works
- [ ] User A can't see User B's products
- [ ] Soft delete works

## 📋 Files to Create

```
lib/
  products.ts ← NEW
  variants.ts ← NEW
  categories.ts ← NEW
  tags.ts ← NEW
```

## 📝 Files to Update

```
lib/
  pricing.ts ← UPDATE getStorefrontPrice()
  checkout.ts ← UPDATE queries

app/
  actions/
    stores.ts ← UPDATE queries
    pricing.ts ← UPDATE queries
  api/
    webhooks/stripe/route.ts ← REMOVE product_sources
  dashboard/
    products/
      page.tsx ← REBUILD
      [id]/page.tsx ← REBUILD
    stores/
      [id]/pricing/page.tsx ← UPDATE
  (public)/
    s/[slug]/page.tsx ← UPDATE
```

## 🆘 If You Get Stuck

**Migration fails:**
- Check DATABASE_URL in .env
- Try manual SQL from drizzle/manual_0009_phase8_rebuild.sql
- Check Drizzle Studio to see current state

**Type errors:**
- Check imports from `@/lib/db/schema`
- Ensure using `products` not `products_v2` in imports
- Schema exports `products` but it queries `products_v2` table

**Multi-tenancy not working:**
- Add `eq(products.userId, userId)` to all queries
- Use `assertBelongsToUser()` in all mutations

**Soft deletes not working:**
- Add `isNull(products.deletedAt)` to all queries
- Use `deleteProduct()` not direct DELETE

## 📚 Reference Documents

1. **PHASE_8_HANDOFF.md** - Complete context and details
2. **PHASE_8_MIGRATION_PLAN.md** - Migration strategy
3. **PHASE_8_STATUS.md** - Current status
4. **lib/db/schema.ts** - New schema (source of truth)
5. **lib/db/schema-old-backup.ts** - Old schema (reference)

## ⏱️ Time Estimate

- Migration: 5 minutes
- Server utilities: 2 hours
- Update existing code: 1 hour
- Product List: 1 hour
- Product Editor: 2 hours
- Pricing page: 30 minutes
- Storefront: 30 minutes
- Testing: 1 hour

**Total: ~8 hours**

## 🎯 Success = All Tests Pass

When you can:
1. Create a product with variants
2. Add categories and tags
3. Attach to a store
4. Set price with comma decimals
5. Publish (set VISIBLE)
6. See it on public page
7. Complete checkout
8. Verify multi-tenancy works

**You're done!** 🎉

---

**Start with Step 1 (Run Migration) and work sequentially.**

**Good luck!** 🚀
