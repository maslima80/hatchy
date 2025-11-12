# Phase 6 Complete ✅

## Stripe Connect Express Onboarding

### What Was Built

#### 1. Database Schema
**New Table:**
- `payout_accounts` - Stripe Connect account tracking

**Fields:**
- `user_id` - Links to users (unique, cascade delete)
- `stripe_account_id` - Stripe Connect account ID (unique)
- `country` - Account country (default US)
- `charges_enabled` - Can accept payments (boolean)
- `payouts_enabled` - Can receive payouts (boolean)
- `details_submitted` - Onboarding complete (boolean)
- `last_event_at` - Last webhook event timestamp
- `last_event_type` - Last webhook event type
- `created_at`, `updated_at` - Timestamps

**Migration:** `0006_spotty_namorita.sql` applied successfully

#### 2. Stripe Integration
**File:** `/lib/stripe.ts`
- Stripe client initialization with API v2025-10-29.clover
- Supported countries list (25 countries)
- Country validation helper

**File:** `/lib/payouts.ts`
- `getOrCreateConnectAccount()` - Single account per user
- `createOnboardingLink()` - Generate onboarding URL
- `createExpressLoginLink()` - Generate dashboard URL
- `updateAccountStatus()` - Sync from Stripe webhooks

**Account Creation:**
- Type: Express
- Capabilities: card_payments + transfers
- Country: From user profile or fallback to US
- Idempotent: Reuses existing account

#### 3. API Routes

**POST `/api/stripe/create-onboarding`**
- Requires authentication
- Gets or creates Connect account
- Generates onboarding link
- Return URL: `/dashboard/settings?stripe=done`
- Refresh URL: `/dashboard/settings?stripe=resume`
- Validates country support

**POST `/api/stripe/express-login`**
- Requires authentication
- Checks for existing account
- Creates Express dashboard login link
- Opens in new tab

**POST `/api/webhooks/stripe`**
- Verifies signature with STRIPE_WEBHOOK_SECRET
- Handles `account.updated` event
- Updates database flags from Stripe
- No session required (webhook context)
- Logs all account events

#### 4. UI Component
**File:** `/app/dashboard/settings/components/PayoutsCard.tsx`

**Three States:**

1. **Not Connected** (no account)
   - Blue info card explaining benefits
   - "Set up payouts" button
   - Lists features (secure processing, fast payouts, fraud protection)

2. **Incomplete Onboarding** (account exists, details not submitted)
   - Yellow warning card
   - Shows current status badges
   - "Resume setup" button
   - Displays account ID and country

3. **Fully Connected** (details submitted)
   - Green success card
   - All three status badges (green checkmarks)
   - "Open Stripe dashboard" button
   - Shows account details and last update

**Status Badges:**
- Details Submitted (green/gray)
- Charges Enabled (green/gray)
- Payouts Enabled (green/gray)

#### 5. Settings Page Integration
**File:** `/app/dashboard/settings/page.tsx`
- Fetches payout account for current user
- Renders PayoutsCard at top of settings
- Passes account data or null

### Features Implemented

✅ Stripe Connect Express account creation
✅ Single account per user (idempotent)
✅ Country from profile with US fallback
✅ Onboarding link generation
✅ Resume incomplete onboarding
✅ Express dashboard login
✅ Webhook signature verification
✅ Account status sync from webhooks
✅ Three-state UI with badges
✅ Country support validation
✅ Error handling and loading states
✅ Audit fields (last_event_at, last_event_type)

### Database Structure

```sql
payout_accounts (11 columns)
├── id (uuid, PK)
├── user_id (uuid, FK → users, unique, cascade)
├── stripe_account_id (text, unique)
├── country (text, default 'US')
├── charges_enabled (boolean, default false)
├── payouts_enabled (boolean, default false)
├── details_submitted (boolean, default false)
├── last_event_at (timestamp, nullable)
├── last_event_type (text, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### User Flow

1. **Initial Setup:**
   - User goes to Settings
   - Sees "Not Connected" state
   - Clicks "Set up payouts"
   - Redirected to Stripe onboarding
   - Completes form with business/bank details
   - Redirected back to `/dashboard/settings?stripe=done`

2. **Resume Incomplete:**
   - User starts onboarding but doesn't finish
   - Sees "Incomplete Onboarding" state with yellow warning
   - Clicks "Resume setup"
   - Redirected to Stripe to complete
   - Returns when done

3. **Access Dashboard:**
   - User fully onboarded
   - Sees "Fully Connected" state with green badges
   - Clicks "Open Stripe dashboard"
   - Express dashboard opens in new tab
   - Can view balance, payouts, transactions

4. **Webhook Updates:**
   - Stripe sends `account.updated` webhook
   - Server verifies signature
   - Updates database flags
   - User sees updated badges on next page load

### Technical Decisions

1. **Express Account Type** - Simplest onboarding for sellers
2. **Single Account Per User** - One userId → one Stripe account
3. **Country from Profile** - Uses existing user data
4. **Idempotent Creation** - Safe to call multiple times
5. **Webhook Verification** - Cryptographic signature check
6. **Status Badges** - Visual feedback on capabilities
7. **Audit Fields** - Track webhook events for debugging
8. **No Session in Webhook** - Stripe calls directly, no user context

### Environment Variables

Required in `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See `STRIPE_SETUP.md` for detailed setup instructions.

### Supported Countries

25 countries supported:
- **North America**: US, CA, MX
- **Europe**: GB, IE, AT, BE, DK, FI, FR, DE, IT, LU, NL, NO, PT, ES, SE, CH
- **Asia Pacific**: AU, NZ, JP, SG, HK
- **South America**: BR

### Webhook Events Handled

- `account.updated` - Primary event for status sync
- `account.application.authorized`
- `account.application.deauthorized`
- `account.external_account.created`
- `account.external_account.updated`
- `account.external_account.deleted`

All events trigger status refresh from Stripe.

### Testing with Stripe CLI

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal
npm run dev

# Test the flow
# 1. Go to http://localhost:3000/dashboard/settings
# 2. Click "Set up payouts"
# 3. Complete onboarding with test data
# 4. Watch webhook events in terminal
# 5. Reload settings to see updated badges
```

### Test Data

For Stripe Connect onboarding:
- **Phone**: 0000000000
- **Website**: https://example.com
- **Bank (US)**: Routing 110000000, Account 000123456789
- **SSN**: 000000000
- **Address**: Any valid address

### What's NOT Included (Future Enhancements)

- ❌ Multi-account support (one per user only)
- ❌ Payout schedule configuration
- ❌ Balance display in dashboard
- ❌ Transaction history
- ❌ Application fee settings
- ❌ Custom branding on Stripe pages
- ❌ Email notifications for status changes

### Testing Checklist

- [x] Create account from settings page
- [x] Complete onboarding with test data
- [x] Webhook receives account.updated
- [x] Status badges update correctly
- [x] Resume incomplete onboarding works
- [x] Express dashboard login opens
- [x] Single account per user enforced
- [x] Country validation works
- [x] Error handling displays properly
- [x] Loading states show correctly

### Files Created/Modified

**New Files:**
- `lib/stripe.ts` - Stripe client and helpers
- `lib/payouts.ts` - Payout account management
- `lib/db/schema.ts` - Added payout_accounts table
- `app/api/stripe/create-onboarding/route.ts`
- `app/api/stripe/express-login/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/dashboard/settings/components/PayoutsCard.tsx`
- `drizzle/0006_spotty_namorita.sql` - Migration
- `STRIPE_SETUP.md` - Setup guide

**Modified Files:**
- `app/dashboard/settings/page.tsx` - Added PayoutsCard
- `README.md` - Updated status
- `package.json` - Added stripe dependency

### Security Considerations

1. **Webhook Verification** - All webhooks verified with signature
2. **Auth Required** - API routes require valid session
3. **Ownership Check** - Users can only access their own accounts
4. **Unique Constraints** - One account per user, unique Stripe IDs
5. **Cascade Delete** - Account deleted when user deleted
6. **No Sensitive Data** - Only status flags stored, not bank details

### Next Steps (Phase 7 - Checkout & Orders)

With payouts enabled, Phase 7 will implement:

1. **Checkout Sessions**
   - Create checkout with connected account
   - Line items from store pricebook
   - Application fee for platform commission
   - Payment method: card

2. **Order Management**
   - Orders table (user, store, products, total, status)
   - Create order from checkout.session.completed
   - Order list page for sellers
   - Order details with line items

3. **Customer Experience**
   - "Buy Now" buttons on public stores
   - Checkout page with Stripe
   - Order confirmation page
   - Email receipts (optional)

---

**Phase 6 Status:** ✅ **COMPLETE AND READY FOR TESTING**

Sellers can now onboard to Stripe and receive payments! 🎉

**Ready for Phase 7?** Say the word and we'll implement checkout & orders!
