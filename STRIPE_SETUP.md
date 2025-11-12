# Stripe Connect Setup Guide

## Environment Variables Required

Add these to your `.env` file:

```bash
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (get from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Getting Your Stripe Keys

### 1. Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Add both to your `.env` file

### 2. Set Up Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
   - For local testing: Use Stripe CLI (see below)
4. Select events to listen for:
   - `account.updated`
   - `account.application.authorized`
   - `account.application.deauthorized`
   - `account.external_account.created`
   - `account.external_account.updated`
   - `account.external_account.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to your `.env` as `STRIPE_WEBHOOK_SECRET`

## Local Development with Stripe CLI

For testing webhooks locally:

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret. Use it as your `STRIPE_WEBHOOK_SECRET` for local testing.

### 4. Test the Flow
1. Start your dev server: `npm run dev`
2. In another terminal, run the Stripe CLI listener (step 3)
3. Go to http://localhost:3000/dashboard/settings
4. Click "Set up payouts"
5. Complete the onboarding with test data
6. Watch the webhook events in your terminal
7. Reload settings page to see updated badges

## Test Data for Onboarding

When testing Stripe Connect onboarding, use these test values:

- **Phone**: Any 10-digit number (e.g., 0000000000)
- **Business website**: Any URL (e.g., https://example.com)
- **Business description**: Any text
- **Bank account** (US):
  - Routing: 110000000
  - Account: 000123456789
- **SSN/EIN**: 000000000
- **Address**: Any valid address

## Supported Countries

The following countries are supported for Stripe Connect Express:

- **North America**: US, CA, MX
- **Europe**: GB, IE, AT, BE, DK, FI, FR, DE, IT, LU, NL, NO, PT, ES, SE, CH
- **Asia Pacific**: AU, NZ, JP, SG, HK
- **South America**: BR

The system defaults to the user's profile country, or US if not set.

## Webhook Events

The webhook handler processes these events:

- `account.updated` - Updates account status flags (charges_enabled, payouts_enabled, details_submitted)
- Other account events - Triggers status refresh

## Troubleshooting

### Webhook signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local testing, use the secret from `stripe listen` command
- For production, use the secret from Stripe Dashboard

### Country not supported
- Check if the country is in the SUPPORTED_COUNTRIES list
- User can override country during onboarding

### Onboarding link expired
- Links expire after a short time
- User can click "Resume setup" to generate a new link

### Status not updating
- Check webhook is configured correctly
- Verify webhook secret matches
- Check server logs for webhook errors
- Run `stripe listen` locally to see webhook events

## Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (starts with `sk_live_` and `pk_live_`)
- [ ] Set up production webhook endpoint
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Test onboarding flow with real bank account
- [ ] Verify webhook events are being received
- [ ] Test Express dashboard login
- [ ] Review Stripe Connect settings in dashboard

## Next Steps (Phase 7)

Once payouts are enabled, Phase 7 will implement:
- Checkout sessions with connected accounts
- Order creation from checkout.session.completed webhook
- Application fees (platform commission)
- Order management dashboard
