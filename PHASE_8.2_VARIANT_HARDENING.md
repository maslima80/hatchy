# Phase 8.2: Variant Hardening Before Printify

## Overview
This phase implements critical hardening improvements to the variant system before Printify integration.

## ✅ Completed Tasks

### 1. Price Resolution Function ✅
**Location:** `/lib/pricing.ts`

Already implemented `resolveProductPrice(productId, storeId, variantId?)` with 3-tier fallback:
1. Variant-specific store price (`store_prices` with `variant_id`)
2. Product-level store price (`store_prices` without `variant_id`)
3. Variant base price (`variants.price_cents`)
4. Returns `null` if no price found

**Usage:**
```typescript
const price = await resolveProductPrice(productId, storeId, variantId);
```

### 2. Variant Hash for Uniqueness ✅
**Migration:** `drizzle/0012_add_variant_hash.sql`
**Script:** `scripts/add-variant-hash.mjs`

**What was added:**
- `variants.option_values_hash` column (TEXT)
- `generate_option_values_hash()` PostgreSQL function using SHA256
- Automatic trigger to update hash on insert/update
- Unique constraint: `(product_id, option_values_hash)` WHERE `deleted_at IS NULL`
- pgcrypto extension enabled

**How it works:**
```sql
-- Hash is auto-generated from sorted option values
-- Example: {"Size":"M","Color":"Red"} → SHA256("Color:Red|Size:M")
```

**Benefits:**
- Prevents duplicate variants with same option combinations
- Stable hash regardless of JSON key order
- Efficient lookups and validation

### 3. Public Variant Selector Component ✅
**Location:** `/components/storefront/VariantSelector.tsx`

**Features:**
- Button-based option selection (Size, Color, etc.)
- Real-time validation (all options must be selected)
- Automatic variant matching via `option_values_json`
- Stock status indicators:
  - "Out of Stock" badge
  - "Only X left" warning for low stock
- Disables "Add to Cart" until valid variant selected
- Passes `{productId, variantId, qty}` to parent

**Props:**
```typescript
interface VariantSelectorProps {
  productId: string;
  options: ProductOption[];
  variants: Variant[];
  defaultPrice: number; // Fallback in cents
  onVariantChange?: (variantId: string | null, price: number) => void;
}
```

**Usage Example:**
```tsx
<VariantSelector
  productId={product.id}
  options={productOptions}
  variants={productVariants}
  defaultPrice={product.priceCents}
  onVariantChange={(variantId, price) => {
    setSelectedVariant(variantId);
    setDisplayPrice(price);
  }}
/>

<Button 
  disabled={!selectedVariant}
  onClick={() => addToCart(productId, selectedVariant, qty)}
>
  Add to Cart
</Button>
```

### 4. Dashboard "Simple" Badge ✅
**Location:** `/app/dashboard/products/page.tsx`

**Updated logic:**
- Shows "Simple" badge when `variationsEnabled = false`
- Shows variant count when `variationsEnabled = true`
- More accurate than counting variants (which could be 0 even when enabled)

**Display:**
```
Simple Product → Badge: "Simple"
Variable Product → Text: "3 variants"
```

## 📋 Remaining Tasks (Not in this phase)

### 5. Visibility Check on Publish
**TODO:** Add validation before publishing:
- Check if `variationsEnabled = true` but no variants exist
- Show friendly toast: "Please add at least one variant before publishing"
- Prevent publish or auto-disable variations

**Suggested implementation:**
```typescript
// In publish handler
if (product.variationsEnabled) {
  const variantCount = await db
    .select({ count: sql`count(*)` })
    .from(variants)
    .where(and(
      eq(variants.productId, productId),
      isNull(variants.deletedAt)
    ));
  
  if (variantCount[0].count === 0) {
    toast.error('Please add at least one variant before publishing');
    return;
  }
}
```

## 🔧 Database Schema Updates

### New Column
```sql
ALTER TABLE variants ADD COLUMN option_values_hash TEXT;
```

### New Functions
```sql
-- Hash generator
CREATE FUNCTION generate_option_values_hash(option_values_json TEXT) 
RETURNS TEXT;

-- Auto-update trigger
CREATE TRIGGER variant_hash_trigger
BEFORE INSERT OR UPDATE OF option_values_json ON variants
FOR EACH ROW EXECUTE FUNCTION update_variant_hash();
```

### New Constraint
```sql
CREATE UNIQUE INDEX variants_product_id_option_values_hash_unique
ON variants (product_id, option_values_hash)
WHERE deleted_at IS NULL;
```

## 🧪 Testing Checklist

### Backend
- [x] Hash function generates consistent values
- [x] Trigger auto-updates hash on variant save
- [x] Unique constraint prevents duplicate combinations
- [x] Price resolution follows correct fallback order
- [ ] Publish validation blocks products without variants

### Frontend
- [x] Dashboard shows "Simple" badge correctly
- [x] Dashboard shows variant count for variable products
- [ ] VariantSelector disables "Add to Cart" until valid
- [ ] VariantSelector shows stock warnings
- [ ] VariantSelector handles out-of-stock variants
- [ ] Price updates when variant changes

### Integration
- [ ] Cart accepts `{productId, variantId, qty}`
- [ ] Checkout resolves correct price per variant
- [ ] Order items store variant_id
- [ ] Printify sync sends correct variant data

## 📊 Data Flow: Storefront Purchase

```
1. User lands on product page
   ↓
2. VariantSelector loads options + variants
   ↓
3. User selects: Size=M, Color=Red
   ↓
4. Component finds matching variant by option_values_json
   ↓
5. Displays price (variant-specific or fallback)
   ↓
6. Enables "Add to Cart" button
   ↓
7. User clicks → addToCart(productId, variantId, qty)
   ↓
8. Cart stores: { product_id, variant_id, quantity }
   ↓
9. Checkout resolves price via resolveProductPrice()
   ↓
10. Order created with variant_id in line items
```

## 🚀 Next Steps (Phase 8.3)

1. **Printify Integration**
   - Map Hatchy variants → Printify variants
   - Sync variant-level pricing
   - Handle variant-specific images
   - Manage variant stock levels

2. **Storefront Integration**
   - Add VariantSelector to product detail page
   - Update cart to handle variant_id
   - Update checkout to resolve variant prices
   - Display variant info in order history

3. **Advanced Features**
   - Variant image picker (already stubbed)
   - Bulk price updates by percentage
   - Import/export variants via CSV
   - Variant-level SEO metadata

## 📝 Notes

- Hash function is **immutable** for query optimization
- Unique constraint only applies to non-deleted variants
- Simple products (variationsEnabled=false) don't need hash
- Price resolution is async (database query)
- VariantSelector is client-side only (no SSR needed)

## 🎯 Success Criteria

- ✅ No duplicate variant combinations possible
- ✅ Price resolution works with 3-tier fallback
- ✅ Dashboard clearly shows Simple vs Variable products
- ✅ Storefront component ready for integration
- ⏳ Publish validation prevents incomplete products
- ⏳ Full cart → checkout → order flow with variants

---

**Status:** Phase 8.2 Core Complete (4/5 tasks)
**Ready for:** Storefront integration + Printify sync
**Blockers:** None
