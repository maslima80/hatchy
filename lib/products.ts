import { db } from './db';
import { products, variants, categories, tags, productCategories, productTags } from './db/schema';
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm';

export type ProductWithRelations = typeof products.$inferSelect & {
  variants?: (typeof variants.$inferSelect)[];
  categories?: (typeof categories.$inferSelect)[];
  tags?: (typeof tags.$inferSelect)[];
};

export type ProductFilters = {
  status?: 'DRAFT' | 'READY';
  type?: 'OWN' | 'POD' | 'DIGITAL';
  categoryIds?: string[];
  tagIds?: string[];
  search?: string;
};

/**
 * Get all products for a user with optional filters
 */
export async function getProductsForUser(
  userId: string,
  filters?: ProductFilters
): Promise<ProductWithRelations[]> {
  let query = db
    .select()
    .from(products)
    .where(
      and(
        eq(products.userId, userId),
        isNull(products.deletedAt)
      )
    )
    .orderBy(desc(products.updatedAt));

  // Apply filters
  const conditions = [
    eq(products.userId, userId),
    isNull(products.deletedAt)
  ];

  if (filters?.status) {
    conditions.push(eq(products.status, filters.status));
  }

  if (filters?.type) {
    conditions.push(eq(products.type, filters.type));
  }

  const productList = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt));

  // Filter by categories if specified
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    const productIds = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, filters.categoryIds));
    
    const ids = productIds.map(p => p.productId);
    return productList.filter(p => ids.includes(p.id));
  }

  // Filter by tags if specified
  if (filters?.tagIds && filters.tagIds.length > 0) {
    const productIds = await db
      .select({ productId: productTags.productId })
      .from(productTags)
      .where(inArray(productTags.tagId, filters.tagIds));
    
    const ids = productIds.map(p => p.productId);
    return productList.filter(p => ids.includes(p.id));
  }

  // Search by title if specified
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return productList.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
  }

  return productList;
}

/**
 * Get a single product by ID with all relations
 */
export async function getProductById(
  productId: string,
  userId: string
): Promise<ProductWithRelations | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.userId, userId),
        isNull(products.deletedAt)
      )
    );

  if (!product) {
    return null;
  }

  // Get variants
  const productVariants = await db
    .select()
    .from(variants)
    .where(
      and(
        eq(variants.productId, productId),
        isNull(variants.deletedAt)
      )
    );

  // Get categories
  const productCategoryIds = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  const productCategs = productCategoryIds.length > 0
    ? await db
        .select()
        .from(categories)
        .where(inArray(categories.id, productCategoryIds.map(pc => pc.categoryId)))
    : [];

  // Get tags
  const productTagIds = await db
    .select({ tagId: productTags.tagId })
    .from(productTags)
    .where(eq(productTags.productId, productId));

  const productTagsList = productTagIds.length > 0
    ? await db
        .select()
        .from(tags)
        .where(inArray(tags.id, productTagIds.map(pt => pt.tagId)))
    : [];

  return {
    ...product,
    variants: productVariants,
    categories: productCategs,
    tags: productTagsList,
  };
}

/**
 * Create or update a product
 */
export async function upsertProduct(
  data: {
    id?: string;
    title: string;
    description?: string;
    type?: 'OWN' | 'POD' | 'DIGITAL';
    status?: 'DRAFT' | 'READY';
    defaultImageUrl?: string;
    weightGrams?: number;
  },
  userId: string
): Promise<typeof products.$inferSelect> {
  if (data.id) {
    // Update existing product
    await assertBelongsToUser(data.id, userId);

    const [updated] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.id))
      .returning();

    return updated;
  } else {
    // Create new product
    const [created] = await db
      .insert(products)
      .values({
        userId,
        title: data.title,
        description: data.description,
        type: data.type || 'OWN',
        status: data.status || 'DRAFT',
        defaultImageUrl: data.defaultImageUrl,
        weightGrams: data.weightGrams,
      })
      .returning();

    return created;
  }
}

/**
 * Soft delete a product
 */
export async function deleteProduct(productId: string, userId: string): Promise<void> {
  await assertBelongsToUser(productId, userId);

  await db
    .update(products)
    .set({ deletedAt: new Date() })
    .where(eq(products.id, productId));
}

/**
 * Assert that a product belongs to a user (throws if not)
 */
export async function assertBelongsToUser(productId: string, userId: string): Promise<void> {
  const [product] = await db
    .select({ userId: products.userId })
    .from(products)
    .where(eq(products.id, productId));

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.userId !== userId) {
    throw new Error('Unauthorized: Product does not belong to user');
  }
}
