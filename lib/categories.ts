import { db } from './db';
import { categories, productCategories } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { assertBelongsToUser } from './products';

/**
 * Generate a URL-friendly slug from a name
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
 * Get all categories for a user
 */
export async function getUserCategories(
  userId: string
): Promise<(typeof categories.$inferSelect)[]> {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

/**
 * Create or update a category
 */
export async function upsertCategory(
  data: {
    id?: string;
    name: string;
    slug?: string;
  },
  userId: string
): Promise<typeof categories.$inferSelect> {
  const slug = data.slug || generateSlug(data.name);

  if (data.id) {
    // Update existing category
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, data.id));

    if (!existing) {
      throw new Error('Category not found');
    }

    if (existing.userId !== userId) {
      throw new Error('Unauthorized: Category does not belong to user');
    }

    const [updated] = await db
      .update(categories)
      .set({
        name: data.name,
        slug,
      })
      .where(eq(categories.id, data.id))
      .returning();

    return updated;
  } else {
    // Create new category
    const [created] = await db
      .insert(categories)
      .values({
        userId,
        name: data.name,
        slug,
      })
      .returning();

    return created;
  }
}

/**
 * Attach categories to a product (replaces existing)
 */
export async function attachCategoriesToProduct(
  productId: string,
  categoryIds: string[],
  userId: string
): Promise<void> {
  // Verify product ownership
  await assertBelongsToUser(productId, userId);

  // Verify all categories belong to user
  if (categoryIds.length > 0) {
    const userCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          inArray(categories.id, categoryIds)
        )
      );

    if (userCategories.length !== categoryIds.length) {
      throw new Error('One or more categories do not belong to user');
    }
  }

  // Remove existing associations
  await db
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  // Add new associations
  if (categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map(categoryId => ({
        productId,
        categoryId,
      }))
    );
  }
}

/**
 * Get categories for a product
 */
export async function getProductCategories(
  productId: string,
  userId: string
): Promise<(typeof categories.$inferSelect)[]> {
  // Verify product ownership
  await assertBelongsToUser(productId, userId);

  const productCategoryIds = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  if (productCategoryIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(categories)
    .where(inArray(categories.id, productCategoryIds.map(pc => pc.categoryId)));
}
