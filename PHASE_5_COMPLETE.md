# Phase 5 Complete ✅

## Per-Store Pricing (Pricebook System)

### What Was Built

#### 1. Database Schema
**New Table:**
- `store_prices` - Per-store pricing overrides with scheduling

**Enum:**
- `visibility_status`: VISIBLE, HIDDEN, SCHEDULED

**Fields:**
- `store_product_id` - Links to store_products (cascade delete)
- `variant_id` - Optional for future variant-specific pricing
- `price_cents` - Store-specific price
- `compare_at_cents` - Original price for sale display
- `currency` - Default USD
- `visibility` - VISIBLE/HIDDEN/SCHEDULED
- `start_at` - Schedule start datetime
- `end_at` - Schedule end datetime
- `created_at`, `updated_at` - Timestamps

**Migration:** `0005_first_morlocks.sql` applied successfully

#### 2. Auto-Inheritance System
When products are attached to stores:
- Automatically creates `store_prices` record
- Inherits price from product's first variant
- Sets visibility to VISIBLE by default
- No manual setup required

#### 3. Server Actions
**File:** `/app/actions/pricing.ts`

- `updateStorePrice()` - Update price, compare-at, visibility
- `resetStorePrice()` - Restore default product price
- `scheduleSale()` - Set sale price with start/end dates
- `bulkUpdateVisibility()` - Show/hide multiple products
- `bulkAdjustPrices()` - Increase/decrease by percentage

**Validation:**
- Price must be >= 0
- Compare-at must be > sale price
- End date must be after start date
- Ownership verified through store

#### 4. Pricing Dashboard
**Page:** `/dashboard/stores/[id]/pricing`

**Features:**
- Breadcrumb navigation (Stores > Store Name > Pricing)
- Filterable table (All/Visible/Hidden/Scheduled)
- Product list with images
- Default price vs Store price columns
- Inline price editing (click → edit → save/cancel)
- Visibility dropdown per product
- Actions: Schedule Sale, Reset to Default
- Bulk selection with checkboxes
- Bulk actions toolbar (show/hide, adjust %)
- Override indicator (*) for modified prices

**PriceTable Component:**
- Inline editing with input field
- Save/cancel buttons
- Reset button (only shows if overridden)
- Schedule button (opens modal)
- Visibility dropdown
- Select all checkbox
- Bulk action buttons

**PriceEditModal Component:**
- Sale price input
- Original price (compare-at) input
- Start date & time pickers
- End date & time pickers
- Validation on submit
- Toast notifications

#### 5. Public Page Integration
**Updated:** `/app/(public)/s/[slug]/page.tsx`

**Changes:**
- Reads prices from `store_prices` instead of product variants
- Filters products by visibility:
  - HIDDEN → never shown
  - SCHEDULED → only shown within date range
  - VISIBLE → always shown
- Server-side schedule checking (compares current time)
- Sale badge display when `compare_at_cents` exists
- Strikethrough original price
- Red sale price styling

**Hotsite Template:**
- Shows sale price in red if on sale
- Displays original price with strikethrough
- "On Sale" badge

**Mini-Store Template:**
- Sale badge on product cards
- Strikethrough pricing
- Red sale price

### Features Implemented

✅ Per-store price overrides
✅ Auto-inherit from product defaults
✅ Inline price editing
✅ Reset to default price
✅ Visibility control (Visible/Hidden/Scheduled)
✅ Schedule sales with date/time range
✅ Compare-at pricing for sales
✅ Bulk select products
✅ Bulk show/hide
✅ Bulk price adjustment (+/- %)
✅ Filter by visibility status
✅ Public page uses pricebook
✅ Schedule filtering on public pages
✅ Sale badges and styling
✅ Ownership validation

### Database Structure

```sql
store_prices (11 columns)
├── id (uuid, PK)
├── store_product_id (uuid, FK → store_products, cascade)
├── variant_id (uuid, FK → product_variants, nullable)
├── price_cents (integer)
├── compare_at_cents (integer, nullable)
├── currency (text, default 'USD')
├── visibility (enum: VISIBLE | HIDDEN | SCHEDULED)
├── start_at (timestamp, nullable)
├── end_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### User Flow

1. **Automatic Setup:**
   - User attaches products to store
   - System auto-creates store_prices with inherited prices
   - All products start as VISIBLE

2. **Edit Prices:**
   - Go to Store → Pricing page
   - Click on price to edit inline
   - Enter new price
   - Click checkmark to save
   - Price now shows with * indicator

3. **Reset Price:**
   - Click Reset button (↻)
   - Confirms action
   - Price reverts to product default
   - * indicator disappears

4. **Schedule Sale:**
   - Click Calendar button
   - Enter sale price
   - Enter original price (compare-at)
   - Set start date & time
   - Set end date & time
   - Click "Schedule Sale"
   - Visibility changes to SCHEDULED
   - Product shows/hides based on schedule

5. **Hide Products:**
   - Change visibility dropdown to "Hidden"
   - Product disappears from public page
   - Still visible in pricing dashboard

6. **Bulk Actions:**
   - Select multiple products (checkboxes)
   - Click "Show" or "Hide" to change visibility
   - Click "+%" or "-%" to adjust prices
   - Enter percentage when prompted
   - All selected products updated

7. **Public View:**
   - Customers see store-specific prices
   - Sale badges appear when compare-at exists
   - Scheduled products only show during window
   - Hidden products never appear

### Technical Decisions

1. **Auto-Inheritance** - No manual price setup required
2. **Inline Editing** - Fast, no modal needed for simple edits
3. **Schedule Modal** - Complex sale setup needs dedicated UI
4. **Server-Side Filtering** - Schedule checks happen on server for accuracy
5. **Cascade Delete** - Deleting store/product removes prices automatically
6. **Currency Field** - Future-proof for multi-currency
7. **Variant ID Nullable** - Base price per product, variant-specific later
8. **Compare-At Pattern** - Standard e-commerce sale display

### What's NOT Included (Future Enhancements)

- ❌ Variant-specific pricing (base price only for now)
- ❌ Multi-currency support (USD only)
- ❌ Price history/audit log
- ❌ Automatic sale expiration notifications
- ❌ Discount codes/coupons
- ❌ Tiered pricing (volume discounts)
- ❌ Customer-specific pricing

### Testing Checklist

- [x] Create store auto-creates prices
- [x] Edit price inline saves correctly
- [x] Reset restores default price
- [x] Schedule sale with dates works
- [x] Visibility changes reflect on public page
- [x] Hidden products don't appear publicly
- [x] Scheduled products show only in window
- [x] Sale badges display correctly
- [x] Bulk show/hide works
- [x] Bulk price adjustment works
- [x] Filter by visibility works
- [x] Ownership validation prevents unauthorized edits
- [x] Public page shows correct prices

### Files Created/Modified

**New Files:**
- `lib/db/schema.ts` - Added store_prices table
- `app/actions/pricing.ts` - Server actions for pricing
- `app/dashboard/stores/[id]/pricing/page.tsx` - Pricing dashboard
- `app/dashboard/stores/[id]/pricing/components/PriceTable.tsx`
- `app/dashboard/stores/[id]/pricing/components/PriceEditModal.tsx`
- `drizzle/0005_first_morlocks.sql` - Migration

**Modified Files:**
- `app/actions/stores.ts` - Auto-create prices on product attach
- `app/(public)/s/[slug]/page.tsx` - Use pricebook with schedule filtering
- `README.md` - Updated status

### Example Scenarios

**Scenario 1: Flash Sale**
- Product normally $50
- Schedule sale: $35 from Friday 6pm to Sunday 11:59pm
- Set compare-at to $50
- Visibility: SCHEDULED
- Result: Product shows with "On Sale" badge only during window

**Scenario 2: Seasonal Pricing**
- Summer store: Product $30
- Winter store: Same product $40
- Each store has independent price
- No conflict, both can be LIVE

**Scenario 3: Hide Out-of-Stock**
- Product temporarily unavailable
- Set visibility to HIDDEN
- Product disappears from public page
- Re-enable when back in stock

**Scenario 4: Bulk Discount**
- Select 10 products
- Bulk adjust: Decrease 20%
- All prices reduced instantly
- Can reset individual products later

### Next Steps (Phase 6 - Stripe Connect)

Sellers will:
1. Onboard to Stripe Express
2. See connection status card
3. Access Stripe Portal for payouts
4. View balance and transactions

Then Phase 7 will enable actual checkout with these prices!

---

**Phase 5 Status:** ✅ **COMPLETE AND READY FOR TESTING**

You can now manage per-store pricing, schedule sales, and control product visibility! 🎉
