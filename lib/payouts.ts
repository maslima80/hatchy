import { db } from '@/lib/db';
import { payoutAccounts, profiles } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { eq } from 'drizzle-orm';

export async function getOrCreateConnectAccount(userId: string, country?: string) {
  // Check if account already exists
  const [existingAccount] = await db
    .select()
    .from(payoutAccounts)
    .where(eq(payoutAccounts.userId, userId))
    .limit(1);

  if (existingAccount) {
    return existingAccount;
  }

  // Get country from profile or use fallback
  let accountCountry = country || 'US';
  if (!country) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    
    if (profile?.country) {
      accountCountry = profile.country;
    }
  }

  // Create Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: accountCountry,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Save to database
  const [newAccount] = await db
    .insert(payoutAccounts)
    .values({
      userId,
      stripeAccountId: account.id,
      country: accountCountry,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
    })
    .returning();

  return newAccount;
}

export async function createOnboardingLink(accountId: string, returnUrl: string, refreshUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

export async function createExpressLoginLink(accountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

export async function updateAccountStatus(stripeAccountId: string, eventType: string) {
  // Fetch latest account data from Stripe
  const account = await stripe.accounts.retrieve(stripeAccountId);

  // Update database
  await db
    .update(payoutAccounts)
    .set({
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      lastEventAt: new Date(),
      lastEventType: eventType,
      updatedAt: new Date(),
    })
    .where(eq(payoutAccounts.stripeAccountId, stripeAccountId));

  return account;
}
