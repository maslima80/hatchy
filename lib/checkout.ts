import { db } from '@/lib/db';
import { stores, products, payoutAccounts, pendingOrders } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { eq } from 'drizzle-orm';
import { getStorefrontPrice as getPriceFromLib } from '@/lib/pricing';

// Re-export the pricing function for backward compatibility
export async function getStorefrontPrice({ 
  storeId, 
  productId,
  variantId 
}: { 
  storeId: string; 
  productId: string;
  variantId?: string;
}) {
  const price = await getPriceFromLib({ storeId, productId, variantId });
  
  if (!price) {
    throw new Error('Product price not configured or product is not visible in this store.');
  }
  
  return price;
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
      success_url: `${baseUrl}/s/${store.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
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
