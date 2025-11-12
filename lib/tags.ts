import { db } from './db';
import { tags, productTags } from './db/schema';
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
 * Get all tags for a user
 */
export async function getUserTags(
  userId: string
): Promise<(typeof tags.$inferSelect)[]> {
  return await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);
}

/**
 * Create or update a tag
 */
export async function upsertTag(
  data: {
    id?: string;
    name: string;
    slug?: string;
  },
  userId: string
): Promise<typeof tags.$inferSelect> {
  const slug = data.slug || generateSlug(data.name);

  if (data.id) {
    // Update existing tag
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.id, data.id));

    if (!existing) {
      throw new Error('Tag not found');
    }

    if (existing.userId !== userId) {
      throw new Error('Unauthorized: Tag does not belong to user');
    }

    const [updated] = await db
      .update(tags)
      .set({
        name: data.name,
        slug,
      })
      .where(eq(tags.id, data.id))
      .returning();

    return updated;
  } else {
    // Create new tag
    const [created] = await db
      .insert(tags)
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
 * Attach tags to a product (replaces existing)
 */
export async function attachTagsToProduct(
  productId: string,
  tagIds: string[],
  userId: string
): Promise<void> {
  // Verify product ownership
  await assertBelongsToUser(productId, userId);

  // Verify all tags belong to user
  if (tagIds.length > 0) {
    const userTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.userId, userId),
          inArray(tags.id, tagIds)
        )
      );

    if (userTags.length !== tagIds.length) {
      throw new Error('One or more tags do not belong to user');
    }
  }

  // Remove existing associations
  await db
    .delete(productTags)
    .where(eq(productTags.productId, productId));

  // Add new associations
  if (tagIds.length > 0) {
    await db.insert(productTags).values(
      tagIds.map(tagId => ({
        productId,
        tagId,
      }))
    );
  }
}

/**
 * Get tags for a product
 */
export async function getProductTags(
  productId: string,
  userId: string
): Promise<(typeof tags.$inferSelect)[]> {
  // Verify product ownership
  await assertBelongsToUser(productId, userId);

  const productTagIds = await db
    .select({ tagId: productTags.tagId })
    .from(productTags)
    .where(eq(productTags.productId, productId));

  if (productTagIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(tags)
    .where(inArray(tags.id, productTagIds.map(pt => pt.tagId)));
}
