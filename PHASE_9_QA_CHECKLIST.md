# Phase 9: Printify Import QA Checklist

## Overview
This document tracks QA testing for the Printify single-product import feature.

## ✅ Fixes Applied

### 1. **Comprehensive Logging**
- ✅ Added debug logging for raw Printify API response
- ✅ Logs product title, description, images, options, variants
- ✅ Logs each step of the import process
- ✅ Logs option creation with values
- ✅ Logs variant creation with mapped options
- ✅ Error logging for failed operations

### 2. **Image Import**
- ✅ Import all Printify images into `product_media` table
- ✅ Set default image (prioritize `is_default` flag)
- ✅ Store images with proper position ordering
- ✅ Handle missing images gracefully with warning

### 3. **Variant Mapping Improvements**
- ✅ Skip disabled variants (`is_enabled = false`)
- ✅ Validate all options are mapped before creating variant
- ✅ Proper position tracking for options and values
- ✅ Cost stored correctly (Printify returns cents already)
- ✅ External ID stored for both product and variants
- ✅ Price left null (intentional - user sets pricing)

### 4. **Error Handling**
- ✅ Validate product has title
- ✅ Validate product has variants
- ✅ Warn if product has no images
- ✅ Skip variants with incomplete option mapping
- ✅ Graceful failure with clear error messages
- ✅ Transaction-safe (errors don't leave partial data)

## 🧪 Testing Checklist

### Test 1: Simple Product (Single Option)
**Product:** Single size, single color (e.g., "One Size" blanket)

**Steps:**
1. [ ] Import product from Printify
2. [ ] Check server logs for debug output
3. [ ] Verify product created with correct title
4. [ ] Verify description imported
5. [ ] Check images in media gallery
6. [ ] Verify `source = 'printify'` and `external_id` set
7. [ ] Open product editor
8. [ ] Verify options tab shows correct option(s)
9. [ ] Verify variants tab shows all enabled variants
10. [ ] Check variant has correct option combination
11. [ ] Verify `cost_cents` is populated
12. [ ] Verify `price_cents` is null
13. [ ] Verify `external_id` on variant

**Expected Results:**
```
Product:
- title: [Printify product name]
- description: [Printify description]
- source: 'printify'
- external_id: [Printify product ID]
- default_image_url: [First image URL]
- variations_enabled: true (if has options)

Media:
- Multiple rows in product_media
- All Printify images imported
- Correct position ordering

Options:
- Option created for each Printify option
- Values created for each option value

Variants:
- One variant per enabled Printify variant
- option_values_json: {"Size": "One Size"}
- cost_cents: [Printify cost]
- price_cents: null
- external_id: [Printify variant ID]
- external_provider: 'printify'
```

### Test 2: Complex Product (Multiple Options)
**Product:** Size x Color matrix (e.g., T-shirt with S/M/L x Black/White/Red)

**Steps:**
1. [ ] Import product from Printify
2. [ ] Check server logs - verify all options logged
3. [ ] Verify product created
4. [ ] Check images imported
5. [ ] Open product editor
6. [ ] Verify both options (Size, Color) appear
7. [ ] Verify all option values present
8. [ ] Check variants tab
9. [ ] Verify variant count matches enabled Printify variants
10. [ ] Spot check 3-5 variants for correct option combos
11. [ ] Verify costs are populated
12. [ ] Verify prices are null
13. [ ] Check external IDs on all variants

**Expected Results:**
```
Options:
- Size: [S, M, L, XL, etc.]
- Color: [Black, White, Red, etc.]

Variants:
- All combinations present (e.g., 12 variants = 4 sizes × 3 colors)
- Each variant has correct option_values_json
  Example: {"Size": "M", "Color": "Black"}
- All costs populated
- All prices null
- All external_ids set
```

### Test 3: Product with Disabled Variants
**Product:** Product with some variants disabled in Printify

**Steps:**
1. [ ] Import product
2. [ ] Check server logs for "Skipped disabled variant" messages
3. [ ] Verify only enabled variants imported
4. [ ] Count variants in Hatchy vs Printify
5. [ ] Confirm skipped count in logs matches

**Expected Results:**
```
Logs show:
- "Skipped disabled variant ID [X]"
- "Import complete: N variants created, M skipped"
- Only enabled variants in database
```

### Test 4: Error Handling
**Test 4a: Product with No Images**
1. [ ] Import product with no images (if available)
2. [ ] Verify warning in logs
3. [ ] Verify product still imports successfully
4. [ ] Check default_image_url is null

**Test 4b: Malformed Data**
1. [ ] Check logs for any warnings about missing option mappings
2. [ ] Verify import doesn't crash
3. [ ] Verify partial data isn't left in database

**Expected Results:**
- Clear error messages
- No database corruption
- Graceful failures

### Test 5: Duplicate Import Prevention
**Steps:**
1. [ ] Import a product successfully
2. [ ] Try to import the same product again
3. [ ] Verify error: "This product has already been imported"
4. [ ] Verify no duplicate data created

### Test 6: Product Editor Integration
**Steps:**
1. [ ] Import product
2. [ ] Navigate to product editor
3. [ ] Verify "Printify" badge shows
4. [ ] Verify external ID displayed
5. [ ] Check all tabs work (Basic, Media, Pricing, Variations)
6. [ ] Verify images appear in Media tab
7. [ ] Verify can edit title, description
8. [ ] Verify can set prices on variants
9. [ ] Verify can bulk edit variants
10. [ ] Save changes and verify they persist

### Test 7: Variant Engine Integration
**Steps:**
1. [ ] Import product with variants
2. [ ] Open Variations tab
3. [ ] Verify variant table shows all variants
4. [ ] Verify option columns match Printify options
5. [ ] Verify can edit SKU, price, cost, stock
6. [ ] Verify bulk edit works
7. [ ] Verify auto-save works
8. [ ] Check variant hash is generated

## 📊 Server Log Analysis

When importing, look for this pattern in server logs:

```
=== PRINTIFY PRODUCT IMPORT DEBUG ===
Product ID: 123456
Title: [Product Name]
Description length: 150
Images count: 4
Images: [
  {
    "src": "https://...",
    "is_default": true,
    ...
  }
]
Options: [
  {
    "name": "Size",
    "values": [
      {"id": 1, "title": "S"},
      {"id": 2, "title": "M"}
    ]
  }
]
Variants count: 6
First variant sample: {
  "id": 789,
  "sku": "...",
  "cost": 1250,
  "is_enabled": true,
  "options": [1, 3]
}
===================================

Created product: [UUID] with 4 images
Imported image 1/4: https://...
Imported image 2/4: https://...
Created option: Size (4 values)
  - Value: S (ID: 1)
  - Value: M (ID: 2)
  - Value: L (ID: 3)
  - Value: XL (ID: 4)
Created option: Color (3 values)
  - Value: Black (ID: 5)
  - Value: White (ID: 6)
  - Value: Red (ID: 7)
Processing 12 variants...
Creating variant 1: {
  sku: "PRINT-123456-S-BLACK",
  options: {"Size": "S", "Color": "Black"},
  costCents: 1250,
  externalId: 789
}
...
Import complete: 12 variants created, 0 skipped
```

## 🐛 Known Issues / Edge Cases

### To Monitor:
- [ ] Printify cost field - confirm it's in cents (not dollars)
- [ ] Option value ID mapping - ensure IDs are stable
- [ ] Image URLs - ensure they're accessible
- [ ] Long product descriptions - check for truncation
- [ ] Special characters in titles/descriptions
- [ ] Products with 3+ options (rare but possible)

## ✅ Success Criteria

A successful import should have:
- ✅ Product title and description match Printify
- ✅ All images in media gallery
- ✅ All options and values created
- ✅ All enabled variants created
- ✅ Correct option combinations on each variant
- ✅ Costs populated, prices null
- ✅ External IDs on product and variants
- ✅ Source = 'printify'
- ✅ Product editable after import
- ✅ No errors in server logs (warnings OK)

## 📝 Notes

**Intentional Behaviors:**
- Prices are null - user must set selling prices
- Stock is null - Printify manages inventory
- Disabled variants are skipped
- Only product-level images imported (no variant-specific images yet)

**Future Enhancements (Not in Scope):**
- Bulk import multiple products
- Variant-specific images
- Automatic price markup rules
- Order submission to Printify
- Webhook sync for updates
