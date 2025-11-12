import { db } from './db';
import { storePrices, storeProducts, products, variants, stores } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Parse locale-aware price input (handles comma decimals)
 * Examples: "12,34" -> 1234, "12.34" -> 1234, "12" -> 1200
 */
export function parsePrice(input: string): number {
  // Remove spaces and currency symbols
  const cleaned = input.replace(/[^\d,.-]/g, '');
  
  // Replace comma with dot for parsing
  const normalized = cleaned.replace(',', '.');
  
  // Parse as float and convert to cents
  const value = parseFloat(normalized);
  
  if (isNaN(value)) {
    throw new Error('Invalid price format');
  }
  
  return Math.round(value * 100);
}

/**
 * Format price in cents to locale string
 * Example: 1234 -> "12,34" (for comma locales) or "12.34" (for dot locales)
 */
export function formatPrice(cents: number, useComma: boolean = false): string {
  const value = cents / 100;
  const formatted = value.toFixed(2);
  
  if (useComma) {
    return formatted.replace('.', ',');
  }
  
  return formatted;
}

/**
 * Get the price for a product/variant in a specific store
 * This is the source of truth for all pricing
 */
export async function getStorefrontPrice(params: {
  storeId: string;
  productId: string;
  variantId?: string;
}): Promise<{ priceCents: number; currency: string } | null> {
  const { storeId, productId, variantId } = params;

  // Check if product is visible in store
  const [storeProduct] = await db
    .select()
    .from(storeProducts)
    .where(
      and(
        eq(storeProducts.storeId, storeId),
        eq(storeProducts.productId, productId),
        eq(storeProducts.visibility, 'VISIBLE')
      )
    );

  if (!storeProduct) {
    return null; // Product not visible in store
  }

  // Check if product is deleted
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        isNull(products.deletedAt)
      )
    );

  if (!product) {
    return null; // Product deleted
  }

  // Try to get store-specific price
  const [storePrice] = await db
    .select()
    .from(storePrices)
    .where(
      and(
        eq(storePrices.storeId, storeId),
        eq(storePrices.productId, productId),
        variantId ? eq(storePrices.variantId, variantId) : isNull(storePrices.variantId)
      )
    );

  if (storePrice && storePrice.priceCents > 0) {
    return {
      priceCents: storePrice.priceCents,
      currency: storePrice.currency,
    };
  }

  // Fallback to variant base price if no store price
  if (variantId) {
    const [variant] = await db
      .select()
      .from(variants)
      .where(
        and(
          eq(variants.id, variantId),
          isNull(variants.deletedAt)
        )
      );

    if (variant && variant.priceCents && variant.priceCents > 0) {
      // Use USD as default currency (can be enhanced later with store settings)
      return {
        priceCents: variant.priceCents,
        currency: 'USD',
      };
    }
  }

  // No valid price found
  return null;
}

/**
 * Set or update a store price for a product/variant
 */
export async function setStorePrice(params: {
  storeId: string;
  productId: string;
  variantId?: string;
  priceCents: number;
  currency: string;
  userId: string;
}): Promise<typeof storePrices.$inferSelect> {
  const { storeId, productId, variantId, priceCents, currency, userId } = params;

  // Verify store ownership
  const [store] = await db
    .select({ userId: stores.userId })
    .from(stores)
    .where(eq(stores.id, storeId));

  if (!store || store.userId !== userId) {
    throw new Error('Unauthorized: Store does not belong to user');
  }

  // Verify product ownership
  const [product] = await db
    .select({ userId: products.userId })
    .from(products)
    .where(eq(products.id, productId));

  if (!product || product.userId !== userId) {
    throw new Error('Unauthorized: Product does not belong to user');
  }

  // Check if price already exists
  const [existing] = await db
    .select()
    .from(storePrices)
    .where(
      and(
        eq(storePrices.storeId, storeId),
        eq(storePrices.productId, productId),
        variantId ? eq(storePrices.variantId, variantId) : isNull(storePrices.variantId)
      )
    );

  if (existing) {
    // Update existing price
    const [updated] = await db
      .update(storePrices)
      .set({
        priceCents,
        currency,
        updatedAt: new Date(),
      })
      .where(eq(storePrices.id, existing.id))
      .returning();

    return updated;
  } else {
    // Create new price
    const [created] = await db
      .insert(storePrices)
      .values({
        storeId,
        productId,
        variantId: variantId || null,
        priceCents,
        currency,
      })
      .returning();

    return created;
  }
}

/**
 * Get all prices for a store
 */
export async function getStorePrices(
  storeId: string,
  userId: string
): Promise<(typeof storePrices.$inferSelect)[]> {
  // Verify store ownership
  const [store] = await db
    .select({ userId: stores.userId })
    .from(stores)
    .where(eq(stores.id, storeId));

  if (!store || store.userId !== userId) {
    throw new Error('Unauthorized: Store does not belong to user');
  }

  return await db
    .select()
    .from(storePrices)
    .where(eq(storePrices.storeId, storeId));
}

/**
 * Check if a product can be set to VISIBLE in a store
 * Returns true only if price > 0
 */
export async function canSetVisible(
  storeId: string,
  productId: string,
  variantId?: string
): Promise<boolean> {
  const price = await getStorefrontPrice({ storeId, productId, variantId });
  return price !== null && price.priceCents > 0;
}
