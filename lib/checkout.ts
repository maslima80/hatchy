import { db } from '@/lib/db';
import { stores, storeProducts, products, storePrices, payoutAccounts, pendingOrders, productVariants } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { eq, and } from 'drizzle-orm';

export async function getStorefrontPrice({ storeId, productId }: { storeId: string; productId: string }) {
  // Get store product relationship
  const [storeProduct] = await db
    .select()
    .from(storeProducts)
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, productId)))
    .limit(1);

  if (!storeProduct) {
    throw new Error('Product not found in store');
  }

  // Get price from store_prices (Phase 5 pricebook)
  const [priceOverride] = await db
    .select()
    .from(storePrices)
    .where(eq(storePrices.storeProductId, storeProduct.id))
    .limit(1);

  // If no store price, try to get default from product variant
  let priceCents = priceOverride?.priceCents || 0;
  let currency = priceOverride?.currency || 'usd';

  // If still no price, try product variant default
  if (priceCents <= 0) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .limit(1);
    
    if (variant && variant.priceCents > 0) {
      priceCents = variant.priceCents;
      // currency stays as 'usd' default
    }
  }

  // Validate price > 0
  if (priceCents <= 0) {
    throw new Error('Product price not configured. Please set a price in the store pricing page.');
  }

  // Check visibility if store price exists
  if (priceOverride) {
    const now = new Date();
    if (priceOverride.visibility === 'HIDDEN') {
      throw new Error('Product is not available');
    }

    if (priceOverride.visibility === 'SCHEDULED') {
      if (!priceOverride.startAt || !priceOverride.endAt) {
        throw new Error('Product is not available');
      }
      if (now < priceOverride.startAt || now > priceOverride.endAt) {
        throw new Error('Product is not available');
      }
    }
  }

  return {
    priceCents,
    currency,
  };
}

export async function getConnectedAccountIdForStore(storeId: string): Promise<string> {
  // Get store owner
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

  if (!store) {
    throw new Error('Store not found');
  }

  // Get payout account
  const [payoutAccount] = await db
    .select()
    .from(payoutAccounts)
    .where(eq(payoutAccounts.userId, store.userId))
    .limit(1);

  if (!payoutAccount) {
    throw new Error('Seller payouts not configured');
  }

  if (!payoutAccount.chargesEnabled) {
    throw new Error('Seller cannot accept payments yet');
  }

  return payoutAccount.stripeAccountId;
}

export async function createCheckoutSession({
  storeId,
  productId,
  quantity = 1,
  baseUrl,
}: {
  storeId: string;
  productId: string;
  quantity?: number;
  baseUrl: string;
}) {
  // Validate quantity
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  // Get store and product details
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

  if (!store) {
    throw new Error('Store not found');
  }

  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (!product) {
    throw new Error('Product not found');
  }

  // Get price and validate visibility
  const { priceCents, currency } = await getStorefrontPrice({ storeId, productId });

  // Log and validate price
  console.log('[Checkout] Creating session:', {
    storeId,
    productId,
    priceCents,
    currency,
    quantity,
  });

  if (priceCents <= 0) {
    throw new Error('Invalid price: must be greater than 0');
  }

  // Get connected account
  const stripeAccountId = await getConnectedAccountIdForStore(storeId);

  // Create Stripe Checkout Session
  const idempotencyKey = `checkout-${storeId}-${productId}-${Date.now()}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          quantity,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: priceCents,
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.defaultImageUrl ? [product.defaultImageUrl] : undefined,
            },
          },
        },
      ],
      success_url: `${baseUrl}/s/${store.slug}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/s/${store.slug}?canceled=1`,
      metadata: {
        storeId,
        productId,
      },
      // For future platform fees:
      // payment_intent_data: {
      //   application_fee_amount: 0,
      // },
    },
    {
      stripeAccount: stripeAccountId,
      idempotencyKey,
    }
  );

  // Save pending order
  await db.insert(pendingOrders).values({
    storeId,
    productId,
    stripeAccountId,
    stripeSessionId: session.id,
    priceCents,
    currency,
  });

  return session.url!;
}
