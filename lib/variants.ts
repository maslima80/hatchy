import { db } from './db';
import { variants, products } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { assertBelongsToUser } from './products';

// Re-export client-safe utilities
export {
  generateVariantCombinations,
  formatOptionValues,
  generateVariantSKU,
  areOptionValuesEqual,
  type ProductOption,
} from './variants-client';

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get all variants for a product
 */
export async function getProductVariants(
  productId: string,
  userId: string
): Promise<(typeof variants.$inferSelect)[]> {
  // Verify ownership
  await assertBelongsToUser(productId, userId);

  return await db
    .select()
    .from(variants)
    .where(
      and(
        eq(variants.productId, productId),
        isNull(variants.deletedAt)
      )
    );
}

/**
 * Create or update a variant
 */
export async function upsertVariant(
  productId: string,
  data: {
    id?: string;
    sku?: string;
    optionsJson?: string;
    costCents?: number;
    priceCents?: number;
  },
  userId: string
): Promise<typeof variants.$inferSelect> {
  // Verify product ownership
  await assertBelongsToUser(productId, userId);

  if (data.id) {
    // Update existing variant
    const [updated] = await db
      .update(variants)
      .set({
        sku: data.sku,
        optionsJson: data.optionsJson,
        costCents: data.costCents,
        priceCents: data.priceCents,
        updatedAt: new Date(),
      })
      .where(eq(variants.id, data.id))
      .returning();

    return updated;
  } else {
    // Create new variant
    const [created] = await db
      .insert(variants)
      .values({
        productId,
        sku: data.sku || null,
        optionsJson: data.optionsJson || '{}',
        costCents: data.costCents || null,
        priceCents: data.priceCents || null,
      })
      .returning();

    return created;
  }
}

/**
 * Soft delete a variant
 */
export async function deleteVariant(
  variantId: string,
  userId: string
): Promise<void> {
  // Get variant to check product ownership
  const [variant] = await db
    .select({ productId: variants.productId })
    .from(variants)
    .where(eq(variants.id, variantId));

  if (!variant) {
    throw new Error('Variant not found');
  }

  // Verify product ownership
  await assertBelongsToUser(variant.productId, userId);

  // Soft delete
  await db
    .update(variants)
    .set({ deletedAt: new Date() })
    .where(eq(variants.id, variantId));
}
