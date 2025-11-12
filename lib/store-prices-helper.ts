import { db } from '@/lib/db';
import { storeProducts, storePrices, productVariants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Ensures a store_prices row exists for a store product.
 * If missing, creates it with price from product variant (or 0 if no variant).
 * Returns the store_prices row.
 */
export async function ensureStorePriceExists(storeProductId: string) {
  // Check if store price already exists
  const [existingPrice] = await db
    .select()
    .from(storePrices)
    .where(eq(storePrices.storeProductId, storeProductId))
    .limit(1);

  if (existingPrice) {
    return existingPrice;
  }

  // Get store product to find product ID
  const [storeProduct] = await db
    .select()
    .from(storeProducts)
    .where(eq(storeProducts.id, storeProductId))
    .limit(1);

  if (!storeProduct) {
    throw new Error('Store product not found');
  }

  // Get first variant price as default
  const [firstVariant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, storeProduct.productId))
    .limit(1);

  const defaultPrice = firstVariant?.priceCents || 0;

  // Create store price
  const [newPrice] = await db
    .insert(storePrices)
    .values({
      storeProductId: storeProduct.id,
      variantId: null,
      priceCents: defaultPrice,
      compareAtCents: null,
      currency: 'USD',
      visibility: 'VISIBLE',
    })
    .returning();

  return newPrice;
}
