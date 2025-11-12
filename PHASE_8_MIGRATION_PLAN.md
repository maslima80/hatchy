# Phase 8 Migration Plan

## Overview
Phase 8 is a **major schema rebuild** that introduces:
- New product type: DIGITAL
- Categories and Tags system
- Product media table
- External links for POD integration
- Per-store title/description overrides
- Simplified pricing model
- Soft deletes
- Proper indexes and unique constraints

## Migration Strategy

### Option 1: Fresh Start (Recommended for Development)
**Best for:** Development/testing environments with no production data

1. Drop all existing product-related tables
2. Create new schema from scratch
3. Re-seed test data

**Pros:**
- Clean slate
- No data migration complexity
- Faster development

**Cons:**
- Loses all existing data

### Option 2: Data Migration (Production)
**Best for:** Production environments with real data

1. Create new tables alongside old ones
2. Migrate data from old → new
3. Update all code to use new tables
4. Drop old tables after verification

**Pros:**
- Preserves data
- Can rollback if needed

**Cons:**
- Complex migration scripts
- Requires downtime or dual-write period

## Current Schema → New Schema Mapping

### Products
```
products (old) → products_v2 (new)
- id → id
- user_id → user_id
- title → title
- description → description
- product_type (POD/DROPSHIP/OWN) → type (OWN/POD/DIGITAL)
  * DROPSHIP → OWN (manual fulfillment)
- status → status
- default_image_url → default_image_url
- created_at → created_at
- updated_at → updated_at
- NEW: deleted_at (soft delete)
- NEW: weight_grams (from product_sources)
```

### Product Variants
```
product_variants (old) → variants (new)
- id → id
- product_id → product_id
- sku → sku
- options_json → options_json
- cost_cents → cost_cents
- price_cents → price_cents (now optional)
- NEW: created_at
- NEW: updated_at
- NEW: deleted_at
```

### Product Sources (DEPRECATED)
```
product_sources → REMOVED
- weight_g → products_v2.weight_grams
- inventory_qty → (handle in application logic)
- Other fields → Not migrated (POD-specific, will use external_links)
```

### Store Products
```
store_products (old) → store_products_v2 (new)
- id → id
- store_id → store_id
- product_id → product_id
- position → position
- visibility → visibility (default now HIDDEN)
- NEW: title_override
- NEW: description_override
- NEW: created_at
```

### Store Prices
```
store_prices (old) → store_prices_v2 (new)
- Simplified structure
- Removed: store_product_id (now uses store_id + product_id directly)
- Removed: compare_at_cents, visibility, start_at, end_at (Phase 9 features)
- Changed: Now has unique constraint on (store_id, product_id, variant_id)
```

### New Tables
```
categories - NEW
tags - NEW
product_categories - NEW (join table)
product_tags - NEW (join table)
product_media - NEW
external_links - NEW (for Printify)
```

## Migration Script Structure

```sql
-- Step 1: Create new tables
CREATE TABLE products_v2 (...);
CREATE TABLE variants (...);
CREATE TABLE product_media (...);
CREATE TABLE categories (...);
CREATE TABLE tags (...);
CREATE TABLE product_categories (...);
CREATE TABLE product_tags (...);
CREATE TABLE external_links (...);
CREATE TABLE store_products_v2 (...);
CREATE TABLE store_prices_v2 (...);

-- Step 2: Migrate data
INSERT INTO products_v2 (id, user_id, title, ...)
SELECT 
  id,
  user_id,
  title,
  description,
  CASE 
    WHEN product_type = 'DROPSHIP' THEN 'OWN'::product_type_v2
    WHEN product_type = 'POD' THEN 'POD'::product_type_v2
    ELSE 'OWN'::product_type_v2
  END as type,
  status::product_status_v2,
  default_image_url,
  (SELECT weight_g FROM product_sources WHERE product_id = products.id LIMIT 1) as weight_grams,
  created_at,
  updated_at,
  NULL as deleted_at
FROM products;

INSERT INTO variants (id, product_id, sku, options_json, cost_cents, price_cents, created_at, updated_at, deleted_at)
SELECT 
  id,
  product_id,
  sku,
  options_json,
  cost_cents,
  price_cents,
  NOW() as created_at,
  NOW() as updated_at,
  NULL as deleted_at
FROM product_variants;

INSERT INTO store_products_v2 (id, store_id, product_id, title_override, description_override, visibility, position, created_at)
SELECT 
  id,
  store_id,
  product_id,
  NULL as title_override,
  NULL as description_override,
  visibility::store_product_visibility_v2,
  position,
  NOW() as created_at
FROM store_products;

INSERT INTO store_prices_v2 (store_id, product_id, variant_id, price_cents, currency, created_at, updated_at)
SELECT 
  sp.store_id,
  sp.product_id,
  spr.variant_id,
  spr.price_cents,
  spr.currency,
  spr.created_at,
  spr.updated_at
FROM store_prices spr
JOIN store_products sp ON spr.store_product_id = sp.id;

-- Step 3: Update orders to reference new products table
-- (orders table doesn't change, but foreign keys need updating)

-- Step 4: Drop old tables (after verification)
DROP TABLE store_prices;
DROP TABLE store_products;
DROP TABLE product_variants;
DROP TABLE product_sources;
DROP TABLE products;
```

## Code Changes Required

### 1. Update all imports
```typescript
// Old
import { products, productVariants, storeProducts, storePrices } from '@/lib/db/schema';

// New
import { products, variants, storeProducts, storePrices } from '@/lib/db/schema-v2';
```

### 2. Update all queries
```typescript
// Old
const [product] = await db.select().from(products).where(eq(products.id, id));

// New - add user_id filter
const [product] = await db
  .select()
  .from(products)
  .where(and(
    eq(products.id, id),
    eq(products.userId, userId),
    isNull(products.deletedAt) // Soft delete check
  ));
```

### 3. Update pricing logic
```typescript
// Old
const [price] = await db
  .select()
  .from(storePrices)
  .where(eq(storePrices.storeProductId, storeProductId));

// New
const [price] = await db
  .select()
  .from(storePrices)
  .where(and(
    eq(storePrices.storeId, storeId),
    eq(storePrices.productId, productId),
    isNull(storePrices.variantId) // Base product price
  ));
```

## Rollback Plan

If migration fails:
1. Keep old tables intact during migration
2. Use feature flag to switch between old/new schema
3. Can revert code changes and drop new tables
4. No data loss if old tables preserved

## Testing Checklist

- [ ] All products migrated correctly
- [ ] All variants migrated correctly
- [ ] All store_products migrated correctly
- [ ] All store_prices migrated correctly
- [ ] Product queries work with user_id filter
- [ ] Soft deletes work correctly
- [ ] Pricing queries return correct prices
- [ ] Checkout still works
- [ ] Orders still reference products correctly
- [ ] Multi-tenancy enforced (user A can't see user B's products)

## Timeline

**Development Environment:**
- Day 1: Create new schema, generate migration
- Day 2: Update all server utilities
- Day 3: Update all UI components
- Day 4: Testing and bug fixes
- Day 5: Documentation and polish

**Production Environment:**
- Requires maintenance window
- Estimated downtime: 30-60 minutes
- Backup database before migration
- Run migration script
- Verify data integrity
- Deploy new code
- Monitor for issues

## Decision: Which Option?

**Recommendation:** Since this is early development and we're implementing Phase 8, let's use **Option 1 (Fresh Start)** with a clean migration that:

1. Creates all new tables with `_v2` suffix
2. Migrates existing data
3. Updates all code to use new tables
4. Drops old tables after verification

This gives us the best of both worlds: clean new schema + data preservation.
