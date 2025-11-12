'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeProducts, products, variants, storePrices } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export type StoreFormData = {
  name: string;
  slug: string;
  type: 'HOTSITE' | 'MINISTORE';
  status: 'DRAFT' | 'LIVE';
  headline?: string;
  subheadline?: string;
  heroImageUrl?: string;
  productIds: string[]; // Product IDs to attach
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createStore(formData: StoreFormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate
  if (!formData.name) {
    throw new Error('Store name is required');
  }

  if (!formData.productIds || formData.productIds.length === 0) {
    throw new Error('At least one product is required');
  }

  if (formData.type === 'HOTSITE' && formData.productIds.length !== 1) {
    throw new Error('Hotsite must have exactly one product');
  }

  // Generate slug if not provided
  const slug = formData.slug || generateSlug(formData.name);

  // Check slug uniqueness
  const [existingStore] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (existingStore) {
    throw new Error('Slug already taken. Please choose a different name.');
  }

  // Verify all products belong to user and are READY
  const userProducts = await db
    .select()
    .from(products)
    .where(and(
      eq(products.userId, session.user.id), 
      eq(products.status, 'READY'),
      isNull(products.deletedAt)
    ));

  const userProductIds = userProducts.map((p) => p.id);
  const invalidProducts = formData.productIds.filter((id) => !userProductIds.includes(id));

  if (invalidProducts.length > 0) {
    throw new Error('Some products are invalid or not ready');
  }

  try {
    // Create store
    const [store] = await db
      .insert(stores)
      .values({
        userId: session.user.id,
        name: formData.name,
        slug,
        type: formData.type,
        status: formData.status,
        headline: formData.headline || null,
        subheadline: formData.subheadline || null,
        heroImageUrl: formData.heroImageUrl || null,
      })
      .returning();

    // Attach products and create initial prices
    for (let i = 0; i < formData.productIds.length; i++) {
      const productId = formData.productIds[i];
      
      // Create store product
      const [storeProduct] = await db.insert(storeProducts).values({
        storeId: store.id,
        productId: productId,
        position: i,
        visibility: 'VISIBLE',
      }).returning();

      // Get product's first variant price as default
      const [firstVariant] = await db
        .select()
        .from(variants)
        .where(and(
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        ))
        .limit(1);

      if (firstVariant && firstVariant.priceCents) {
        // Create initial store price (inherits from product)
        await db.insert(storePrices).values({
          storeId: store.id,
          productId: productId,
          variantId: null, // Base price, not variant-specific
          priceCents: firstVariant.priceCents,
          currency: 'USD',
        });
      }
    }

    revalidatePath('/dashboard/stores');
    return { success: true, storeId: store.id, slug: store.slug };
  } catch (error) {
    console.error('Create store error:', error);
    throw new Error('Failed to create store');
  }
}

export async function updateStore(storeId: string, formData: StoreFormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const [existingStore] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!existingStore || existingStore.userId !== session.user.id) {
    throw new Error('Store not found or unauthorized');
  }

  // Validate
  if (!formData.name) {
    throw new Error('Store name is required');
  }

  if (!formData.productIds || formData.productIds.length === 0) {
    throw new Error('At least one product is required');
  }

  if (formData.type === 'HOTSITE' && formData.productIds.length !== 1) {
    throw new Error('Hotsite must have exactly one product');
  }

  // Check slug uniqueness (if changed)
  if (formData.slug !== existingStore.slug) {
    const [slugTaken] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, formData.slug))
      .limit(1);

    if (slugTaken) {
      throw new Error('Slug already taken');
    }
  }

  // Verify products
  const userProducts = await db
    .select()
    .from(products)
    .where(and(
      eq(products.userId, session.user.id), 
      eq(products.status, 'READY'),
      isNull(products.deletedAt)
    ));

  const userProductIds = userProducts.map((p) => p.id);
  const invalidProducts = formData.productIds.filter((id) => !userProductIds.includes(id));

  if (invalidProducts.length > 0) {
    throw new Error('Some products are invalid or not ready');
  }

  try {
    // Update store
    await db
      .update(stores)
      .set({
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        status: formData.status,
        headline: formData.headline || null,
        subheadline: formData.subheadline || null,
        heroImageUrl: formData.heroImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    // Delete existing products (cascade will delete prices)
    await db.delete(storeProducts).where(eq(storeProducts.storeId, storeId));

    // Recreate products and prices
    for (let i = 0; i < formData.productIds.length; i++) {
      const productId = formData.productIds[i];
      
      const [storeProduct] = await db.insert(storeProducts).values({
        storeId: storeId,
        productId: productId,
        position: i,
        visibility: 'VISIBLE',
      }).returning();

      // Get product's first variant price as default
      const [firstVariant] = await db
        .select()
        .from(variants)
        .where(and(
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        ))
        .limit(1);

      if (firstVariant && firstVariant.priceCents) {
        await db.insert(storePrices).values({
          storeId: storeId,
          productId: productId,
          variantId: null,
          priceCents: firstVariant.priceCents,
          currency: 'USD',
        });
      }
    }

    revalidatePath('/dashboard/stores');
    revalidatePath(`/dashboard/stores/${storeId}`);
    revalidatePath(`/s/${formData.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Update store error:', error);
    throw new Error('Failed to update store');
  }
}

export async function deleteStore(storeId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const [existingStore] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!existingStore || existingStore.userId !== session.user.id) {
    throw new Error('Store not found or unauthorized');
  }

  try {
    await db.delete(stores).where(eq(stores.id, storeId));
    revalidatePath('/dashboard/stores');
    return { success: true };
  } catch (error) {
    console.error('Delete store error:', error);
    throw new Error('Failed to delete store');
  }
}

export async function toggleStoreStatus(storeId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store || store.userId !== session.user.id) {
    throw new Error('Store not found or unauthorized');
  }

  const newStatus = store.status === 'DRAFT' ? 'LIVE' : 'DRAFT';

  try {
    await db
      .update(stores)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(stores.id, storeId));

    revalidatePath('/dashboard/stores');
    revalidatePath(`/dashboard/stores/${storeId}`);
    revalidatePath(`/s/${store.slug}`);
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Toggle status error:', error);
    throw new Error('Failed to toggle status');
  }
}
