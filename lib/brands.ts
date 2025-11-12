import { db } from './db';
import { brands } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get all brands for a user
 */
export async function getUserBrands(userId: string) {
  return await db
    .select()
    .from(brands)
    .where(eq(brands.userId, userId))
    .orderBy(brands.name);
}

/**
 * Create or get existing brand by name
 * Used for inline brand creation
 */
export async function upsertBrand(name: string, userId: string) {
  const slug = generateSlug(name);

  // Check if exists
  const [existing] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.userId, userId), eq(brands.slug, slug)))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create new
  const [newBrand] = await db
    .insert(brands)
    .values({
      userId,
      name,
      slug,
    })
    .returning();

  return newBrand;
}

/**
 * Delete a brand
 */
export async function deleteBrand(brandId: string, userId: string) {
  // Verify ownership
  const [brand] = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!brand || brand.userId !== userId) {
    throw new Error('Brand not found or unauthorized');
  }

  await db.delete(brands).where(eq(brands.id, brandId));
}
