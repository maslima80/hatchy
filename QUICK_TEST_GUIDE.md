# Quick Test Guide - Product Manager v3 🧪

## 🎯 How to Test Everything

### 1. Fix the Session Error First

The JWT error you're seeing is because your session cookie is corrupted. **Fix it:**

```bash
# Clear your browser cookies for localhost:3000
# Or use Incognito/Private mode
# Or clear this specific cookie: next-auth.session-token
```

**In Chrome:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" → "http://localhost:3000"
4. Delete `next-auth.session-token`
5. Refresh page

### 2. Add ImageKit Environment Variables

In your `.env` file, add these two lines (copy from existing keys):

```bash
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id/
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
```

### 3. Restart the Server

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

---

## 🧪 Test Flow

### Step 1: Create Your First Product

1. Go to `http://localhost:3000/dashboard/products`
2. Click "Add Product" button
3. You'll see a beautiful centered form with:
   - 📦 Package icon
   - "Create Your Product" title
   - Clean, spacious layout

4. Fill in:
   - **Title:** "Test Product"
   - **Description:** "My first product"
   - **Type:** Own Product

5. Click "Create Product"
6. **You'll be redirected to Product Manager v3!** 🎉

### Step 2: Explore Product Manager v3

You should now see:

**Left Column:**
- ✅ Basic Information (title, description)
- ✅ Media section (with ImageKit uploader)
- ✅ Pricing & Inventory
- ✅ Product Variations (toggle)
- ✅ Personalization (toggle)

**Right Column:**
- ✅ Product Type dropdown
- ✅ Organization (categories, tags, brands)
- ✅ Visibility & Publishing

### Step 3: Test Auto-Save

1. Edit the title
2. Click outside the field (blur)
3. See "Saving..." indicator
4. Refresh page → Changes saved! ✅

### Step 4: Test Inline Creation

**Categories:**
1. Type "Summer Collection" in category input
2. Press Enter or click +
3. Category created and selected!
4. Badge appears below

**Tags:**
1. Type "bestseller"
2. Press Enter
3. Tag created!

**Brands:**
1. Type "Nike"
2. Press Enter
3. Brand created!

### Step 5: Test Image Upload

1. Scroll to "Media" section
2. Drag an image from your desktop
3. Drop it on the upload zone
4. See upload progress
5. Image appears in grid!
6. Hover → See delete button
7. First image has "Main" badge

### Step 6: Test Toggles

**Track Inventory:**
1. Toggle ON
2. Quantity field appears
3. Enter "100"
4. Blur → Auto-saves

**Personalization:**
1. Toggle ON
2. Prompt field appears
3. Enter "Enter your name"
4. Blur → Auto-saves

### Step 7: Test Pricing

1. Enter Price: 29.99
2. Enter Compare At: 39.99
3. Enter SKU: PROD-001
4. Select Unit: "Pound"
5. Blur each field → Auto-saves

---

## ✅ Expected Results

### Beautiful Quick Start Form
- Centered layout
- Package icon
- Clear instructions
- Info box explaining next steps
- Large, friendly buttons

### Product Manager v3
- Single-page layout (no tabs!)
- 2-column responsive grid
- Card-based sections
- Auto-save on blur
- Visual feedback
- Inline creation working
- Image upload working
- Toggles working

### Auto-Save
- "Saving..." indicator appears
- Changes persist on refresh
- No data loss

### Inline Creation
- Type + Enter = Created
- Instantly selectable
- No modals
- Smooth experience

### Image Upload
- Drag & drop works
- Click to browse works
- Upload progress shown
- Images appear in grid
- Delete button on hover
- First image = Main

---

## 🐛 Troubleshooting

### "Unauthorized" Error
**Problem:** Session expired or corrupted
**Fix:** Clear cookies and log in again

### Images Not Uploading
**Problem:** Missing `NEXT_PUBLIC_*` env vars
**Fix:** Add them to `.env` and restart server

### Auto-Save Not Working
**Problem:** Product ID missing
**Fix:** Make sure you're editing an existing product (not on /new page)

### Inline Creation Not Working
**Problem:** API routes not found
**Fix:** Restart dev server

### Old Page Still Showing
**Problem:** Browser cache
**Fix:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

---

## 🎉 Success Checklist

- [ ] Session working (no JWT errors)
- [ ] Can create new product
- [ ] Redirects to Product Manager v3
- [ ] Auto-save working (see "Saving..." indicator)
- [ ] Can create categories inline
- [ ] Can create tags inline
- [ ] Can create brands inline
- [ ] Can upload images
- [ ] Can delete images
- [ ] Toggles work (inventory, personalization)
- [ ] All fields save on blur
- [ ] Changes persist on refresh

---

## 📸 What You Should See

### New Product Form
```
┌─────────────────────────────────────┐
│          [Package Icon]             │
│                                     │
│      Create Your Product            │
│  Start with the basics - you'll    │
│  add images, pricing, and details  │
│                                     │
│  Product Title *                    │
│  [Input field]                      │
│                                     │
│  Quick Description (optional)       │
│  [Textarea]                         │
│                                     │
│  Product Type                       │
│  [Dropdown]                         │
│                                     │
│  [Info box with sparkle icon]       │
│                                     │
│  [Create Product] [Cancel]          │
└─────────────────────────────────────┘
```

### Product Manager v3
```
┌─────────────────────────────────────────────────────┐
│  Products / Edit          [DRAFT]  [Save Product]   │
├──────────────────────────┬──────────────────────────┤
│  📦 Basic Information    │  📚 Product Type         │
│  🖼️ Media                │  🏷️ Organization         │
│  💰 Pricing & Inventory  │  👁️ Visibility           │
│  🎨 Variations           │                          │
│  💬 Personalization      │                          │
└──────────────────────────┴──────────────────────────┘
```

---

## 🚀 Next Steps After Testing

Once everything works:

1. **Create more products** - Test with different types
2. **Upload multiple images** - Test the grid layout
3. **Test on mobile** - Responsive design
4. **Test variant matrix** (coming soon)
5. **Deploy to production** 🎉

---

## 💡 Pro Tips

1. **Use Incognito** - Avoids cookie issues
2. **Keep DevTools open** - See console logs
3. **Test auto-save** - Edit and blur multiple fields
4. **Try keyboard shortcuts** - Enter to create inline items
5. **Upload multiple images** - See the grid in action

---

Built with ❤️ - Ready to test!
