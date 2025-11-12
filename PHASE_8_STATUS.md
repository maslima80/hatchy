# Phase 8 Status - Migration in Progress

## ✅ Completed

### 1. New Schema Design
- Created complete Phase 8 schema (`lib/db/schema.ts` - replaced old schema)
- All new tables defined:
  - `products_v2` - Main products with soft deletes
  - `variants` - Product variants with SKU
  - `product_media` - Images/videos per product or variant
  - `categories` - User categories
  - `tags` - User tags
  - `product_categories` - Join table
  - `product_tags` - Join table
  - `external_links` - For Printify integration
  - `store_products_v2` - Products attached to stores with overrides
  - `store_prices_v2` - Simplified per-store pricing

### 2. Migration SQL
- Generated migration: `drizzle/0009_typical_sentinels.sql`
- Created manual migration: `drizzle/manual_0009_phase8_rebuild.sql`
- Migration script: `scripts/run-phase8-migration.ts`

### 3. Key Schema Changes
**Products:**
- Added `DIGITAL` type (OWN, POD, DIGITAL)
- Added `weight_grams` (from product_sources)
- Added `deleted_at` for soft deletes
- Removed `product_sources` table (consolidated)

**Variants:**
- Simplified structure
- `price_cents` now optional (store_prices is source of truth)
- Added soft deletes

**Store Products:**
- Added `title_override` and `description_override`
- Default visibility changed to `HIDDEN` (must explicitly publish)
- Removed dependency on `store_product_id` in pricing

**Store Prices:**
- Simplified: direct reference to `store_id + product_id + variant_id`
- Removed scheduling features (Phase 9)
- Unique constraint on (store_id, product_id, variant_id)

## 🚧 Blocked / In Progress

### Migration Execution
**Status:** Cannot run migration yet

**Reason:** DATABASE_URL not accessible in current environment

**Options:**
1. **Run migration manually** when you start dev server
2. **Use Drizzle Studio** to apply migration
3. **Run via npm script** with proper env loading

**To run migration:**
```bash
# Option 1: Via npm script (recommended)
npm run db:push

# Option 2: Manual SQL
# Copy contents of drizzle/manual_0009_phase8_rebuild.sql
# Run in your database client

# Option 3: Via script
npx tsx --env-file=.env scripts/run-phase8-migration.ts
```

## 📋 Next Steps (After Migration)

### 1. Update All Imports
Every file that imports from `schema.ts` needs updates:
- `products` → still `products` (but now `products_v2` table)
- `productVariants` → `variants`
- `storeProducts` → still `storeProducts` (but now `store_products_v2` table)
- `storePrices` → still `storePrices` (but now `store_prices_v2` table)
- `productSources` → REMOVED

**Files to update:**
- `/app/actions/products.ts`
- `/app/actions/stores.ts`
- `/app/actions/pricing.ts`
- `/app/api/checkout/route.ts`
- `/app/api/webhooks/stripe/route.ts`
- `/lib/checkout.ts`
- All dashboard pages
- All public pages

### 2. Create Server Utilities
**`/lib/products.ts`:**
```typescript
- getProductsForUser(userId, filters)
- getProductById(productId, userId)
- upsertProduct(data, userId)
- deleteProduct(productId, userId) // soft delete
- assertBelongsToUser(product, userId)
```

**`/lib/pricing.ts`:**
```typescript
- getStorefrontPrice({ storeId, productId, variantId? })
- setStorePrice({ storeId, productId, variantId?, priceCents, currency })
- getStorePrices(storeId, userId)
- canSetVisible(storeId, productId) // checks price > 0
```

**`/lib/variants.ts`:**
```typescript
- upsertVariant(productId, data, userId)
- deleteVariant(variantId, userId)
- getProductVariants(productId, userId)
```

**`/lib/categories.ts`:**
```typescript
- getUserCategories(userId)
- upsertCategory(data, userId)
- attachCategoriesToProduct(productId, categoryIds, userId)
```

**`/lib/tags.ts`:**
```typescript
- getUserTags(userId)
- upsertTag(data, userId)
- attachTagsToProduct(productId, tagIds, userId)
```

### 3. Build UI Components

**Product List (`/dashboard/products/page.tsx`):**
- Table with filters (Status, Type, Category, Tag)
- Bulk actions (Set Status, Add/Remove Category/Tag, Delete)
- Search by title
- Pagination

**Product Editor (`/dashboard/products/[id]/page.tsx`):**
- Tab 1: Basics (Title, Description, Type, Status, Image, Categories, Tags)
- Tab 2: Variants & Media (Variant table, Media gallery)
- Tab 3: Publishing (Attach to stores, per-store overrides, pricing, visibility)

**Pricing Overview (`/dashboard/stores/[id]/pricing/page.tsx`):**
- Already exists, needs update for new schema
- Show all attached products
- Inline price editing with locale support
- Visibility toggle (blocked if price ≤ 0)

### 4. Update Storefront
- Update public pages to use `getStorefrontPrice()`
- Check `store_products_v2.visibility = 'VISIBLE'`
- Handle soft deletes (`deleted_at IS NULL`)

### 5. Security & Multi-tenancy
- Add `assertBelongsToUser()` to all mutations
- All queries must filter by `user_id`
- All queries must check `deleted_at IS NULL`
- Store product queries must check `visibility = 'VISIBLE'`

## 🎯 Acceptance Criteria

- [ ] Migration runs successfully
- [ ] All existing code updated to new schema
- [ ] Product List page with filters works
- [ ] Product Editor with 3 tabs works
- [ ] Can create product with 2 variants
- [ ] Can attach product to store
- [ ] Can set price (handles comma decimals: 1,00 → 100 cents)
- [ ] Cannot set VISIBLE if price ≤ 0
- [ ] Public page shows only VISIBLE products
- [ ] Checkout validates price > 0
- [ ] Multi-tenancy enforced (user A can't see user B's products)
- [ ] Soft deletes work (deleted products don't show)

## 📊 Migration Impact

**Tables Dropped:**
- `products` → `products_v2`
- `product_variants` → `variants`
- `product_sources` → REMOVED
- `store_products` → `store_products_v2`
- `store_prices` → `store_prices_v2`

**Tables Created:**
- `categories`
- `tags`
- `product_categories`
- `product_tags`
- `product_media`
- `external_links`

**Data Loss:**
- All existing products (test data only)
- All existing variants (test data only)
- All existing store products (test data only)
- All existing store prices (test data only)

**Preserved:**
- Users
- Profiles
- Stores
- Orders (foreign keys updated)
- Payout accounts

## 🚀 Ready to Proceed?

**Before continuing, you need to:**

1. **Run the migration** using one of the methods above
2. **Verify migration** - check that new tables exist in database
3. **Confirm** - Let me know when migration is complete

**Then I will:**
1. Create all server utilities
2. Update all existing code
3. Build new UI components
4. Test everything end-to-end

**Estimated time after migration:**
- Server utilities: 1-2 hours
- UI components: 3-4 hours
- Testing & polish: 1-2 hours
- **Total: 5-8 hours of development**

---

**Current Status:** ⏸️ **PAUSED - Waiting for migration to run**

**Next Action:** Run migration, then continue with Phase 8 implementation
