# Phase 8.1: Variant Engine MVP - Implementation Plan

## ✅ Completed

### 1. Database Schema
- ✅ Created `product_options` table (id, product_id, name, position)
- ✅ Created `product_option_values` table (id, option_id, value, position)
- ✅ Updated `variants` table with:
  - `option_values_json` JSONB column
  - `cost_cents`, `stock`, `image_url` columns
- ✅ Updated `products` table with `variations_enabled` boolean
- ✅ `store_prices` already has `variant_id` (nullable)
- ✅ Migration file created: `drizzle/0011_variant_engine.sql`
- ✅ Schema pushed to database

## 🔄 In Progress

### 2. Utility Functions
Need to create `/lib/variants.ts` with:
- `generateVariantCombinations(options)` - Cartesian product generator
- `formatOptionValues(json)` - Display helper
- `validateVariantData(variant)` - Validation

### 3. API Routes
Need to create:
- `/api/products/[id]/options/route.ts` - CRUD for options
- `/api/products/[id]/options/[optionId]/values/route.ts` - CRUD for values
- `/api/products/[id]/variants/generate/route.ts` - Generate combinations
- `/api/products/[id]/variants/bulk-update/route.ts` - Bulk edit

### 4. UI Components
Need to create:
- `VariationsTab.tsx` - Main tab in ProductManagerV3
- `OptionGroupsEditor.tsx` - Add/edit/remove option groups
- `VariantTable.tsx` - Editable table for variants
- `VariantBulkEdit.tsx` - Modal for bulk operations
- `VariantImagePicker.tsx` - Image selector for variants

### 5. ProductManagerV3 Integration
- Add "Variations" tab
- Toggle "Enable Variations"
- Conditional rendering based on `variationsEnabled`

### 6. Price Resolution
- Update storefront to resolve variant prices
- Fallback logic: variant price → product price → error

### 7. Checkout Integration
- Add variant selector to product page
- Pass `variant_id` to checkout
- Store `variant_id` in order line items

---

## Implementation Steps

### Step 1: Variant Utilities (30 min)
Create `/lib/variants.ts`:

```typescript
export interface ProductOption {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

export function generateVariantCombinations(
  options: ProductOption[]
): Record<string, string>[] {
  if (options.length === 0) return [];
  
  // Cartesian product
  const combinations: Record<string, string>[] = [];
  
  function generate(index: number, current: Record<string, string>) {
    if (index === options.length) {
      combinations.push({ ...current });
      return;
    }
    
    const option = options[index];
    for (const value of option.values) {
      current[option.name] = value.value;
      generate(index + 1, current);
    }
  }
  
  generate(0, {});
  return combinations;
}

export function formatOptionValues(json: Record<string, string>): string {
  return Object.entries(json)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ');
}

export function generateVariantSKU(
  basesku: string,
  options: Record<string, string>
): string {
  const suffix = Object.values(options)
    .map(v => v.substring(0, 3).toUpperCase())
    .join('-');
  return `${baseSKU}-${suffix}`;
}
```

### Step 2: API Routes (1 hour)

**A) Options CRUD**
`/api/products/[id]/options/route.ts`:
- GET: List all options for product
- POST: Create new option
- PATCH: Update option (name, position)
- DELETE: Delete option (cascades to values and regenerates variants)

**B) Option Values CRUD**
`/api/products/[id]/options/[optionId]/values/route.ts`:
- GET: List values for option
- POST: Add value
- DELETE: Remove value (regenerates variants)

**C) Generate Variants**
`/api/products/[id]/variants/generate/route.ts`:
- POST: Generate all combinations
- Logic:
  1. Fetch all options and values
  2. Generate combinations using utility
  3. Create variant rows with `option_values_json`
  4. Auto-generate SKUs
  5. Return created variants

**D) Bulk Update**
`/api/products/[id]/variants/bulk-update/route.ts`:
- PATCH: Update multiple variants
- Body: `{ variantIds: string[], updates: { priceCents?, stock?, costCents? } }`

### Step 3: Option Groups Editor (1 hour)

`OptionGroupsEditor.tsx`:
```tsx
interface OptionGroup {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

- Input to add new option group (e.g., "Size")
- For each group:
  - Input to add values (e.g., "Small", "Medium", "Large")
  - Drag to reorder values
  - X button to remove
- "Generate Variants" button (only enabled if 1+ option with 1+ value)
```

### Step 4: Variant Table (1.5 hours)

`VariantTable.tsx`:
```tsx
Columns:
- Option Values (read-only, formatted)
- SKU (editable inline)
- Price (editable, optional override)
- Cost (editable, optional)
- Stock (editable, optional)
- Image (picker modal)
- Actions (delete)

Features:
- Checkbox column for bulk selection
- Inline editing with auto-save
- Empty state when no variants
- Loading states
```

### Step 5: Bulk Edit Modal (30 min)

`VariantBulkEdit.tsx`:
```tsx
Modal with:
- Selected count display
- Price adjustment (set to X, or add/subtract Y)
- Stock adjustment (set to X, or add/subtract Y)
- Cost adjustment
- Apply button
```

### Step 6: Variations Tab (1 hour)

`VariationsTab.tsx`:
```tsx
Layout:
1. Toggle "Enable Variations"
2. If enabled:
   - OptionGroupsEditor
   - "Generate Variants" button
   - VariantTable
   - Bulk actions toolbar
3. If disabled:
   - Message: "Enable variations to create product options"
```

### Step 7: ProductManagerV3 Integration (30 min)

Update `ProductManagerV3.tsx`:
- Add "Variations" tab
- Pass `variationsEnabled` state
- Toggle handler updates DB
- Conditional rendering

### Step 8: Price Resolution (45 min)

Update `/lib/pricing.ts`:
```typescript
export async function resolveProductPrice(
  productId: string,
  storeId: string,
  variantId?: string
): Promise<number | null> {
  // 1. Try variant-specific price
  if (variantId) {
    const variantPrice = await db
      .select()
      .from(storePrices)
      .where(
        and(
          eq(storePrices.storeId, storeId),
          eq(storePrices.productId, productId),
          eq(storePrices.variantId, variantId)
        )
      )
      .limit(1);
    
    if (variantPrice[0]?.priceCents > 0) {
      return variantPrice[0].priceCents;
    }
  }
  
  // 2. Fallback to product-level price
  const productPrice = await db
    .select()
    .from(storePrices)
    .where(
      and(
        eq(storePrices.storeId, storeId),
        eq(storePrices.productId, productId),
        isNull(storePrices.variantId)
      )
    )
    .limit(1);
  
  return productPrice[0]?.priceCents || null;
}
```

### Step 9: Storefront Variant Selector (1 hour)

Update product page to show variant selector when `variationsEnabled`:
```tsx
<VariantSelector
  options={productOptions}
  selectedValues={selectedValues}
  onSelect={(optionName, value) => {
    // Update selected values
    // Find matching variant
    // Update price display
  }}
/>
```

### Step 10: Checkout Integration (30 min)

Update checkout:
- Accept `variantId` in add-to-cart
- Store in session/cart
- Pass to Stripe metadata
- Save in order line items

---

## Testing Checklist

### Option Groups
- [ ] Add option group "Size"
- [ ] Add values: S, M, L
- [ ] Add option group "Color"
- [ ] Add values: Red, Blue
- [ ] Reorder values
- [ ] Delete a value
- [ ] Delete an option group

### Variant Generation
- [ ] Click "Generate Variants"
- [ ] See 6 variants (3 sizes × 2 colors)
- [ ] Each has unique SKU
- [ ] Each has correct option_values_json

### Variant Editing
- [ ] Edit SKU inline
- [ ] Edit price inline
- [ ] Edit stock inline
- [ ] Select variant image
- [ ] Changes auto-save

### Bulk Edit
- [ ] Select 3 variants
- [ ] Set price to $29.99
- [ ] Apply
- [ ] All 3 updated

### Storefront
- [ ] Product page shows variant selector
- [ ] Select Size: M
- [ ] Select Color: Red
- [ ] Price updates to variant price
- [ ] Add to cart with variant_id

### Checkout
- [ ] Cart shows "Size: M / Color: Red"
- [ ] Checkout includes variant_id
- [ ] Order created with variant_id
- [ ] Inventory decremented for specific variant

---

## File Structure

```
/lib
  variants.ts (utilities)
  pricing.ts (updated)

/app/api/products/[id]
  /options
    route.ts (CRUD)
    /[optionId]
      /values
        route.ts (CRUD)
  /variants
    /generate
      route.ts (generate combinations)
    /bulk-update
      route.ts (bulk edit)

/app/dashboard/products/components
  /variants
    VariationsTab.tsx
    OptionGroupsEditor.tsx
    VariantTable.tsx
    VariantBulkEdit.tsx
    VariantImagePicker.tsx

/app/(public)/s/[slug]/components
  VariantSelector.tsx (storefront)
```

---

## Time Estimate

- Utilities: 30 min
- API Routes: 1 hour
- Option Groups Editor: 1 hour
- Variant Table: 1.5 hours
- Bulk Edit: 30 min
- Variations Tab: 1 hour
- ProductManagerV3 Integration: 30 min
- Price Resolution: 45 min
- Storefront Selector: 1 hour
- Checkout Integration: 30 min

**Total: ~8 hours** (MVP, functional but not fancy)

---

## Next Session

Start with:
1. Create `/lib/variants.ts` utility
2. Create API routes for options
3. Build OptionGroupsEditor component
4. Test option CRUD flow

Then continue with variant generation and table.
