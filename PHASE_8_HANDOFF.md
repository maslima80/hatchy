# Phase 8 Handoff Document - Product Manager v2

## 🎯 Original Objective

Build a simple, powerful product system that:
- Supports any product type (OWN, POD, DIGITAL)
- Is ready for Printify import
- Has proper multi-tenancy and security
- Includes categories, tags, and media management
- Has per-store pricing with locale support (comma decimals)
- Enforces price > 0 before publishing

## 📋 Original Prompt Summary

**Phase 8 Requirements:**

1. **Data Model** - Create/update tables:
   - `products_v2` - with soft deletes, weight_grams, DIGITAL type
   - `variants` - SKU, options_json, optional price_cents
   - `product_media` - images/videos per product or variant
   - `categories` + `product_categories` (join)
   - `tags` + `product_tags` (join)
   - `store_products_v2` - with title/description overrides
   - `store_prices_v2` - simplified (store_id + product_id + variant_id)
   - `external_links` - for Printify integration

2. **Security** - All queries filter by user_id, assertBelongsToUser() utility

3. **UI/UX** - Three screens:
   - **Product List** - Filters, bulk actions, search
   - **Product Editor** - 3 tabs (Basics, Variants & Media, Publishing)
   - **Pricing Overview** - Per-store pricing with locale support

4. **Server Utilities** - lib/products.ts, lib/pricing.ts with proper functions

5. **Storefront Integration** - Use getStorefrontPrice(), check visibility

6. **Acceptance Tests** - Create product → attach to store → set price (1,00 → 100 cents) → publish → checkout works

## ✅ What Has Been Completed

### 1. Schema Design ✅
**File:** `/lib/db/schema.ts` (replaced old schema)

**New Tables Created:**
- `products_v2` - Main products with soft deletes, weight_grams, type enum (OWN/POD/DIGITAL)
- `variants` - Product variants with SKU, options_json, cost_cents, price_cents (optional)
- `product_media` - Media gallery with variant assignment
- `categories` - User categories with slug
- `tags` - User tags with slug
- `product_categories` - Join table
- `product_tags` - Join table
- `external_links` - For Printify (provider, external_product_id, metadata_json)
- `store_products_v2` - With title_override, description_override, visibility (default HIDDEN)
- `store_prices_v2` - Simplified structure with unique constraint

**Key Changes:**
- Removed `product_sources` table (consolidated into products)
- Removed `product_variants` → renamed to `variants`
- Simplified `store_prices` → no more store_product_id dependency
- Added soft deletes (`deleted_at`)
- Added proper indexes and unique constraints

### 2. Migration Files ✅
**Created:**
- `drizzle/0009_typical_sentinels.sql` - Auto-generated
- `drizzle/manual_0009_phase8_rebuild.sql` - Clean manual migration
- `scripts/run-phase8-migration.ts` - Migration runner script

**Migration Strategy:**
- Option A (chosen): Fresh start - drop old tables, create new ones
- Drops: products, product_variants, product_sources, store_products, store_prices
- Creates: All new v2 tables
- Updates: Foreign keys in orders and pending_orders

### 3. Documentation ✅
**Created:**
- `PHASE_8_MIGRATION_PLAN.md` - Detailed migration strategy
- `PHASE_8_STATUS.md` - Current status and next steps
- `PHASE_8_HANDOFF.md` - This document

### 4. Backup ✅
**Created:**
- `lib/db/schema-old-backup.ts` - Backup of old schema

## 🚧 What Needs to Be Done

### STEP 1: Run Migration (CRITICAL - DO THIS FIRST)

**The migration has NOT been run yet.** The schema file has been replaced but the database still has old tables.

**To run migration:**

```bash
# Option 1: Simple push (RECOMMENDED)
cd /Users/marciolima/Projects/hatchy
pnpm drizzle-kit push
# When prompted about data loss, confirm YES

# Option 2: Via script
npx tsx --env-file=.env scripts/run-phase8-migration.ts

# Option 3: Manual SQL
# Open drizzle/manual_0009_phase8_rebuild.sql
# Copy all SQL and run in database client
```

**Verify migration worked:**
```bash
pnpm drizzle-kit studio
# Check that products_v2, variants, categories, tags, etc. exist
# Check that old products, product_variants tables are gone
```

### STEP 2: Create Server Utilities

**File:** `/lib/products.ts` (NEW)
```typescript
// Required functions:
- getProductsForUser(userId, filters) // with status, type, category, tag filters
- getProductById(productId, userId)
- upsertProduct(data, userId)
- deleteProduct(productId, userId) // soft delete (set deleted_at)
- assertBelongsToUser(product, userId) // throws if not owner
```

**File:** `/lib/pricing.ts` (UPDATE EXISTING)
```typescript
// Update existing getStorefrontPrice to use new schema:
- getStorefrontPrice({ storeId, productId, variantId? })
  * Query store_prices_v2 with (store_id, product_id, variant_id)
  * Fallback to variants.price_cents if no store price
  * Throw if price <= 0
  * Check visibility = VISIBLE
  * Check deleted_at IS NULL

// New functions:
- setStorePrice({ storeId, productId, variantId?, priceCents, currency })
- getStorePrices(storeId, userId)
- canSetVisible(storeId, productId) // returns true if price > 0
```

**File:** `/lib/variants.ts` (NEW)
```typescript
- upsertVariant(productId, data, userId)
- deleteVariant(variantId, userId) // soft delete
- getProductVariants(productId, userId)
```

**File:** `/lib/categories.ts` (NEW)
```typescript
- getUserCategories(userId)
- upsertCategory(data, userId) // auto-generate slug
- attachCategoriesToProduct(productId, categoryIds, userId)
- getProductCategories(productId, userId)
```

**File:** `/lib/tags.ts` (NEW)
```typescript
- getUserTags(userId)
- upsertTag(data, userId) // auto-generate slug
- attachTagsToProduct(productId, tagIds, userId)
- getProductTags(productId, userId)
```

### STEP 3: Update Existing Code

**Files that import from schema.ts need updates:**

1. `/app/actions/products.ts` - Update all queries to use new schema
2. `/app/actions/stores.ts` - Update store_products and store_prices queries
3. `/app/actions/pricing.ts` - Update to use store_prices_v2
4. `/lib/checkout.ts` - Update getStorefrontPrice() calls
5. `/app/api/checkout/route.ts` - Update product queries
6. `/app/api/webhooks/stripe/route.ts` - Update inventory decrement (no more product_sources)
7. `/app/dashboard/products/[id]/page.tsx` - Update to use variants instead of productVariants
8. `/app/dashboard/stores/[id]/pricing/page.tsx` - Update to use new schema

**Key changes in queries:**
```typescript
// OLD
const [product] = await db.select().from(products).where(eq(products.id, id));

// NEW - add user_id filter and soft delete check
const [product] = await db
  .select()
  .from(products)
  .where(and(
    eq(products.id, id),
    eq(products.userId, userId),
    isNull(products.deletedAt)
  ));
```

### STEP 4: Build Product List Page

**File:** `/app/dashboard/products/page.tsx` (REBUILD)

**Features:**
- Table with columns: Title, Type, Variants count, Categories/Tags (chips), Updated, Status
- Filters: Status (All/Draft/Ready), Type (All/Own/POD/Digital), Category, Tag
- Search by title
- Bulk actions: Set Status, Add/Remove Category/Tag, Delete (soft)
- Pagination (10 per page)
- "New Product" button

**Use:** `getProductsForUser()` from lib/products.ts

### STEP 5: Build Product Editor

**File:** `/app/dashboard/products/[id]/page.tsx` (REBUILD)

**Tab 1: Basics**
- Title (required)
- Description (textarea)
- Type (OWN/POD/DIGITAL)
- Status (DRAFT/READY)
- Default Image (upload or URL)
- Weight (grams)
- Categories (multi-select with create new)
- Tags (multi-select with create new)

**Tab 2: Variants & Media**
- Variant table: SKU, Options JSON, Cost, Price
- Add/Edit/Delete variants inline
- Media gallery: Upload images, assign to product or variant, reorder

**Tab 3: Publishing**
- "Attach to Stores" button → modal to select stores
- List of attached stores with:
  - Title override (optional)
  - Description override (optional)
  - Price input (locale-safe: 12,34 → 1234 cents)
  - Currency (from store)
  - Visibility toggle (HIDDEN/VISIBLE)
  - Guardrail: Cannot set VISIBLE if price <= 0 (show error)

### STEP 6: Update Pricing Overview

**File:** `/app/dashboard/stores/[id]/pricing/page.tsx` (UPDATE)

**Changes needed:**
- Query `store_products_v2` instead of `store_products`
- Query `store_prices_v2` with new structure
- Update price input to use new schema
- Add visibility toggle per product
- Block visibility if price <= 0

### STEP 7: Update Storefront

**Files:**
- `/app/(public)/s/[slug]/page.tsx` - Update to use new schema
- `/lib/checkout.ts` - Already updated getStorefrontPrice()

**Changes:**
- Check `store_products_v2.visibility = 'VISIBLE'`
- Check `products.deleted_at IS NULL`
- Use `getStorefrontPrice()` for all pricing

### STEP 8: Update Webhook

**File:** `/app/api/webhooks/stripe/route.ts`

**Changes:**
- Remove inventory decrement logic (no more product_sources)
- Or implement inventory tracking in application logic
- Update product queries to use products_v2

### STEP 9: Testing

**Acceptance Tests:**
1. Create product with 2 variants ✓
2. Attach to store ✓
3. Set price with comma: "12,34" → stores as 1234 cents ✓
4. Try to set VISIBLE with price 0 → blocked with error ✓
5. Set price > 0, set VISIBLE ✓
6. Public page shows product with correct price ✓
7. Checkout works and charges correct amount ✓
8. User A cannot see/edit User B's products ✓
9. Soft delete works (deleted products don't show) ✓

## 📁 File Structure

```
/Users/marciolima/Projects/hatchy/

lib/
  db/
    schema.ts ← NEW SCHEMA (v2)
    schema-old-backup.ts ← OLD SCHEMA BACKUP
  products.ts ← CREATE THIS
  pricing.ts ← UPDATE THIS
  variants.ts ← CREATE THIS
  categories.ts ← CREATE THIS
  tags.ts ← CREATE THIS
  checkout.ts ← UPDATE getStorefrontPrice()

app/
  dashboard/
    products/
      page.tsx ← REBUILD (Product List)
      [id]/
        page.tsx ← REBUILD (Product Editor with 3 tabs)
    stores/
      [id]/
        pricing/
          page.tsx ← UPDATE (use new schema)

drizzle/
  manual_0009_phase8_rebuild.sql ← RUN THIS MIGRATION
  0009_typical_sentinels.sql ← AUTO-GENERATED

scripts/
  run-phase8-migration.ts ← MIGRATION RUNNER

PHASE_8_MIGRATION_PLAN.md ← DETAILED PLAN
PHASE_8_STATUS.md ← CURRENT STATUS
PHASE_8_HANDOFF.md ← THIS FILE
```

## 🚨 Critical Notes

1. **Migration MUST run first** - Nothing will work until migration is applied
2. **All queries need user_id filter** - Multi-tenancy is critical
3. **All queries need deleted_at IS NULL** - Soft deletes must be respected
4. **Price input must normalize commas** - "1,00" → 100 cents
5. **Cannot set VISIBLE if price <= 0** - Enforce in UI and server
6. **getStorefrontPrice() is source of truth** - Use everywhere for pricing

## 🎯 Success Criteria

- [ ] Migration runs successfully
- [ ] All server utilities created
- [ ] All existing code updated
- [ ] Product List page works with filters
- [ ] Product Editor works with 3 tabs
- [ ] Can create product with variants
- [ ] Can attach to store and set price
- [ ] Comma decimals work (1,00 → 100 cents)
- [ ] Cannot publish with zero price
- [ ] Public page shows only visible products
- [ ] Checkout validates price > 0
- [ ] Multi-tenancy enforced
- [ ] Soft deletes work

## 🚀 Start Here

```bash
# 1. Run migration
cd /Users/marciolima/Projects/hatchy
pnpm drizzle-kit push

# 2. Verify migration
pnpm drizzle-kit studio
# Check new tables exist

# 3. Create server utilities
# Start with lib/products.ts

# 4. Update existing code
# Start with lib/checkout.ts

# 5. Build UI
# Start with Product List page

# 6. Test everything
# Follow acceptance criteria
```

## 💡 Tips for Next Assistant

- **Read PHASE_8_MIGRATION_PLAN.md** for detailed context
- **Check PHASE_8_STATUS.md** for current state
- **Use schema.ts** as source of truth for table structure
- **Test queries in Drizzle Studio** before implementing
- **Add console.log()** for debugging multi-tenancy
- **Use existing components** from /components/ui
- **Follow existing patterns** from Phase 7 code

## 📞 Questions to Ask User

1. Has the migration run successfully?
2. Can you access Drizzle Studio to verify tables?
3. Do you want to start with server utilities or UI first?
4. Any specific features to prioritize?

---

**Current Status:** ⏸️ **READY FOR MIGRATION**

**Next Action:** Run migration, then build Phase 8 features

**Estimated Time:** 5-8 hours after migration

Good luck! 🚀
