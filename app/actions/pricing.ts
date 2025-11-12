'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { storePrices, storeProducts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function updateStorePrice(data: {
  storePriceId: string;
  priceCents: number;
  compareAtCents?: number;
  visibility?: 'VISIBLE' | 'HIDDEN' | 'SCHEDULED';
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership through store
  const [priceRecord] = await db
    .select({
      storePrice: storePrices,
      storeProduct: storeProducts,
      store: stores,
    })
    .from(storePrices)
    .innerJoin(storeProducts, eq(storePrices.storeProductId, storeProducts.id))
    .innerJoin(stores, eq(storeProducts.storeId, stores.id))
    .where(eq(storePrices.id, data.storePriceId))
    .limit(1);

  if (!priceRecord || priceRecord.store.userId !== session.user.id) {
    throw new Error('Price record not found or unauthorized');
  }

  // Validate
  if (data.priceCents < 0) {
    throw new Error('Price must be >= 0');
  }

  try {
    await db
      .update(storePrices)
      .set({
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents || null,
        visibility: data.visibility || priceRecord.storePrice.visibility,
        updatedAt: new Date(),
      })
      .where(eq(storePrices.id, data.storePriceId));

    revalidatePath(`/dashboard/stores/${priceRecord.store.id}/pricing`);
    revalidatePath(`/s/${priceRecord.store.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Update price error:', error);
    throw new Error('Failed to update price');
  }
}

export async function resetStorePrice(storePriceId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get the price record with store and product info
  const [priceRecord] = await db
    .select({
      storePrice: storePrices,
      storeProduct: storeProducts,
      store: stores,
    })
    .from(storePrices)
    .innerJoin(storeProducts, eq(storePrices.storeProductId, storeProducts.id))
    .innerJoin(stores, eq(storeProducts.storeId, stores.id))
    .where(eq(storePrices.id, storePriceId))
    .limit(1);

  if (!priceRecord || priceRecord.store.userId !== session.user.id) {
    throw new Error('Price record not found or unauthorized');
  }

  try {
    // Get product's default price from variants
    const { productVariants, products } = await import('@/lib/db/schema');
    const [firstVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, priceRecord.storeProduct.productId))
      .limit(1);

    if (!firstVariant) {
      throw new Error('No variant found for product');
    }

    // Reset to default price
    await db
      .update(storePrices)
      .set({
        priceCents: firstVariant.priceCents,
        compareAtCents: null,
        startAt: null,
        endAt: null,
        updatedAt: new Date(),
      })
      .where(eq(storePrices.id, storePriceId));

    revalidatePath(`/dashboard/stores/${priceRecord.store.id}/pricing`);
    revalidatePath(`/s/${priceRecord.store.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Reset price error:', error);
    throw new Error('Failed to reset price');
  }
}

export async function scheduleSale(data: {
  storePriceId: string;
  priceCents: number;
  compareAtCents: number;
  startAt: Date;
  endAt: Date;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const [priceRecord] = await db
    .select({
      storePrice: storePrices,
      storeProduct: storeProducts,
      store: stores,
    })
    .from(storePrices)
    .innerJoin(storeProducts, eq(storePrices.storeProductId, storeProducts.id))
    .innerJoin(stores, eq(storeProducts.storeId, stores.id))
    .where(eq(storePrices.id, data.storePriceId))
    .limit(1);

  if (!priceRecord || priceRecord.store.userId !== session.user.id) {
    throw new Error('Price record not found or unauthorized');
  }

  // Validate
  if (data.priceCents < 0) {
    throw new Error('Sale price must be >= 0');
  }

  if (data.compareAtCents <= data.priceCents) {
    throw new Error('Compare at price must be higher than sale price');
  }

  if (data.startAt >= data.endAt) {
    throw new Error('End date must be after start date');
  }

  try {
    await db
      .update(storePrices)
      .set({
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents,
        visibility: 'SCHEDULED',
        startAt: data.startAt,
        endAt: data.endAt,
        updatedAt: new Date(),
      })
      .where(eq(storePrices.id, data.storePriceId));

    revalidatePath(`/dashboard/stores/${priceRecord.store.id}/pricing`);
    revalidatePath(`/s/${priceRecord.store.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Schedule sale error:', error);
    throw new Error('Failed to schedule sale');
  }
}

export async function bulkUpdateVisibility(data: {
  storeId: string;
  storePriceIds: string[];
  visibility: 'VISIBLE' | 'HIDDEN';
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify store ownership
  const [store] = await db.select().from(stores).where(eq(stores.id, data.storeId)).limit(1);

  if (!store || store.userId !== session.user.id) {
    throw new Error('Store not found or unauthorized');
  }

  try {
    for (const priceId of data.storePriceIds) {
      await db
        .update(storePrices)
        .set({
          visibility: data.visibility,
          updatedAt: new Date(),
        })
        .where(eq(storePrices.id, priceId));
    }

    revalidatePath(`/dashboard/stores/${data.storeId}/pricing`);
    revalidatePath(`/s/${store.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Bulk update error:', error);
    throw new Error('Failed to update visibility');
  }
}

export async function bulkAdjustPrices(data: {
  storeId: string;
  storePriceIds: string[];
  adjustmentType: 'increase' | 'decrease';
  percentage: number;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify store ownership
  const [store] = await db.select().from(stores).where(eq(stores.id, data.storeId)).limit(1);

  if (!store || store.userId !== session.user.id) {
    throw new Error('Store not found or unauthorized');
  }

  if (data.percentage <= 0 || data.percentage > 100) {
    throw new Error('Percentage must be between 1 and 100');
  }

  try {
    for (const priceId of data.storePriceIds) {
      const [currentPrice] = await db
        .select()
        .from(storePrices)
        .where(eq(storePrices.id, priceId))
        .limit(1);

      if (currentPrice) {
        const multiplier = data.adjustmentType === 'increase' ? 1 + data.percentage / 100 : 1 - data.percentage / 100;
        const newPrice = Math.round(currentPrice.priceCents * multiplier);

        await db
          .update(storePrices)
          .set({
            priceCents: Math.max(0, newPrice),
            updatedAt: new Date(),
          })
          .where(eq(storePrices.id, priceId));
      }
    }

    revalidatePath(`/dashboard/stores/${data.storeId}/pricing`);
    revalidatePath(`/s/${store.slug}`);
    return { success: true };
  } catch (error) {
    console.error('Bulk adjust error:', error);
    throw new Error('Failed to adjust prices');
  }
}
