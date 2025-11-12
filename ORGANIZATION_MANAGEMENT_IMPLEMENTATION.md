# Product Organization Management System 🎯

## Overview

Complete management dashboard for Categories, Tags, and Brands with:
- ✅ Inline editing (click to rename)
- ✅ Delete with usage warnings
- ✅ Merge duplicates
- ✅ Product count display
- ⏳ Smart duplicate detection (Phase 2)

---

## Phase 1: Management Dashboard ✅

### Files Created

1. **`/app/dashboard/organization/page.tsx`**
   - Server component that fetches all categories/tags/brands with product counts
   - Uses SQL aggregation to count products per item
   - Passes data to client component

2. **`/app/dashboard/organization/OrganizationManager.tsx`**
   - Client component with tabs for Categories, Tags, Brands
   - Manages state for all three types
   - Renders OrganizationTable for each tab

3. **`/app/dashboard/organization/OrganizationTable.tsx`**
   - Reusable table component for all three types
   - Features:
     - Inline editing (click pencil → edit → save/cancel)
     - Delete with confirmation dialog
     - Merge functionality with dropdown selector
     - Product count badges
     - Warning when deleting items in use

4. **`/app/api/categories/[id]/route.ts`**
   - PATCH: Update category name
   - DELETE: Delete category
   
5. **`/hooks/use-toast.ts`**
   - Simple toast hook (using alerts for now)
   - Can be replaced with proper toast library later

---

## Features

### 1. Inline Editing
```
┌─────────────────────────────────────┐
│ Name          │ Products │ Actions  │
├─────────────────────────────────────┤
│ Electronics   │ 12       │ ✏️ 🔀 🗑️ │
│ [Input____] ✓ ✗          │ 8        │ (editing)
│ Clothing      │ 5        │ ✏️ 🔀 🗑️ │
└─────────────────────────────────────┘
```

**How it works:**
1. Click pencil icon → Input appears
2. Edit name → Press Enter or click ✓
3. Press Escape or click ✗ to cancel
4. Auto-generates new slug from name

### 2. Delete with Warnings
```
┌─────────────────────────────────────┐
│ ⚠️  Delete category?                │
│                                     │
│ ⚠️  This category is used in        │
│     12 products.                    │
│                                     │
│ Deleting it will remove it from     │
│ all products. This cannot be undone.│
│                                     │
│ [Cancel]  [Delete]                  │
└─────────────────────────────────────┘
```

**Features:**
- Shows warning if item is used in products
- Displays product count
- Confirms before deletion
- Cascading delete (removes from all products)

### 3. Merge Duplicates
```
┌─────────────────────────────────────┐
│ Merge category                      │
│                                     │
│ Merge "Electronis" into another     │
│ category. All products will be      │
│ updated to use the target category. │
│                                     │
│ Select target category:             │
│ [Electronics (12 products) ▼]       │
│                                     │
│ [Cancel]  [Merge]                   │
└─────────────────────────────────────┘
```

**How it works:**
1. Click merge icon on source item
2. Select target from dropdown
3. Confirm merge
4. All products updated to use target
5. Source item deleted
6. Product counts combined

---

## API Routes

### Categories
- `PATCH /api/categories/[id]` - Update name
- `DELETE /api/categories/[id]` - Delete category
- `POST /api/categories/merge` - Merge two categories

### Tags
- `PATCH /api/tags/[id]` - Update name
- `DELETE /api/tags/[id]` - Delete tag
- `POST /api/tags/merge` - Merge two tags

### Brands
- `PATCH /api/brands/[id]` - Update name
- `DELETE /api/brands/[id]` - Delete brand
- `POST /api/brands/merge` - Merge two brands

---

## TODO: Phase 2 - Smart Duplicate Detection

### Feature 1: Similar Name Detection
When creating a new category/tag/brand, check for similar names:

```typescript
// Levenshtein distance algorithm
function similarity(a: string, b: string): number {
  // Calculate edit distance
  // Return similarity score 0-1
}

// In OrganizationCombobox onCreate:
const similar = options.filter(opt => 
  similarity(name.toLowerCase(), opt.name.toLowerCase()) > 0.8
);

if (similar.length > 0) {
  // Show suggestion dialog
  "Did you mean 'Electronics'?"
  [Use Existing] [Create New]
}
```

### Feature 2: Auto-Suggest While Typing
```
┌─────────────────────────────────────┐
│ Add category...                     │
│ elec▊                               │
├─────────────────────────────────────┤
│ Existing matches:                   │
│ ✓ Electronics (12 products)        │  ← Click to select
│ ✓ Electrical (3 products)          │
├─────────────────────────────────────┤
│ + Create "elec"                     │  ← Or create new
└─────────────────────────────────────┘
```

**Implementation:**
- Already partially implemented in OrganizationCombobox
- Shows existing options as you type
- Prevents exact duplicates
- Need to add fuzzy matching for similar names

### Feature 3: Bulk Merge Tool
```
┌─────────────────────────────────────┐
│ Potential Duplicates Detected       │
│                                     │
│ ☑️ Electronics (12) → Electronis (2)│
│ ☑️ T-Shirt (5) → Tshirt (3)        │
│ ☐ Mug (8) → Cup (4)                │
│                                     │
│ [Merge Selected]  [Skip]            │
└─────────────────────────────────────┘
```

---

## Navigation Integration

Add to your main navigation:

```tsx
// In your sidebar/nav component
<NavLink href="/dashboard/organization">
  <FolderTree className="w-4 h-4" />
  Organization
</NavLink>
```

---

## Database Queries

### Fetch with Product Counts (Categories)
```sql
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(DISTINCT pc.product_id)::int as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.category_id
WHERE c.user_id = $1
GROUP BY c.id, c.name, c.slug
```

### Merge Operation (Categories)
```sql
-- 1. Update all product_categories
UPDATE product_categories
SET category_id = $targetId
WHERE category_id = $sourceId;

-- 2. Delete source category
DELETE FROM categories
WHERE id = $sourceId;
```

---

## Testing Checklist

### Editing
- [ ] Click pencil → Input appears with current name
- [ ] Edit name → Press Enter → Saves
- [ ] Edit name → Press Escape → Cancels
- [ ] Edit name → Click ✓ → Saves
- [ ] Edit name → Click ✗ → Cancels
- [ ] Empty name → Shows error

### Deleting
- [ ] Click trash on unused item → Confirms → Deletes
- [ ] Click trash on used item → Shows warning with count
- [ ] Confirm delete → Removes from all products
- [ ] Cancel delete → Nothing happens

### Merging
- [ ] Click merge → Dialog opens
- [ ] Select target → Merge button enables
- [ ] Confirm merge → Products updated
- [ ] Source item removed
- [ ] Target count increases
- [ ] Only one merge icon disabled if only 1 item

### Product Counts
- [ ] Shows correct count per item
- [ ] Badge color: default if > 0, secondary if 0
- [ ] Count updates after merge
- [ ] Count updates after delete

---

## Next Steps

1. **Create similar routes for Tags and Brands**
   - Copy `/api/categories/[id]/route.ts`
   - Rename to `/api/tags/[id]/route.ts` and `/api/brands/[id]/route.ts`
   - Update table names

2. **Create merge API routes**
   - `/api/categories/merge/route.ts`
   - `/api/tags/merge/route.ts`
   - `/api/brands/merge/route.ts`

3. **Implement Smart Duplicate Detection**
   - Add Levenshtein distance function
   - Show suggestions when creating
   - Add bulk merge tool

4. **Add to Navigation**
   - Update sidebar with "Organization" link
   - Add icon and badge if needed

5. **Replace Toast with Proper Library**
   - Install `sonner` or similar
   - Update `use-toast.ts`
   - Add toast container to layout

---

## Usage Example

### Fixing a Typo
1. Go to `/dashboard/organization`
2. Click "Categories" tab
3. Find "Electronis" (typo)
4. Click pencil icon
5. Change to "Electronics"
6. Press Enter → Saved!

### Merging Duplicates
1. Go to `/dashboard/organization`
2. Click "Tags" tab
3. Find "T-Shirt" and "Tshirt"
4. Click merge icon on "Tshirt"
5. Select "T-Shirt" from dropdown
6. Click "Merge"
7. All products with "Tshirt" now have "T-Shirt"
8. "Tshirt" is deleted

### Deleting Unused
1. Go to `/dashboard/organization`
2. Click "Brands" tab
3. Find brand with "0 products"
4. Click trash icon
5. Confirm → Deleted!

---

**Status:** Phase 1 Complete (Management Dashboard)  
**Next:** Phase 2 (Smart Duplicate Detection)
