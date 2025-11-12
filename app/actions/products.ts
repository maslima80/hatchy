'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productSources, productVariants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type ProductFormData = {
  title: string;
  description?: string;
  productType: 'POD' | 'DROPSHIP' | 'OWN';
  status: 'DRAFT' | 'READY';
  defaultImageUrl?: string;
  // Source fields
  provider?: string;
  providerSku?: string;
  externalSupplierUrl?: string;
  leadTimeDays?: number;
  inventoryQty?: number;
  weightG?: number;
  // Variants
  variants: Array<{
    id?: string;
    sku?: string;
    optionsJson?: string;
    costCents: number;
    priceCents: number;
  }>;
};

export async function createProduct(formData: ProductFormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate required fields
  if (!formData.title) {
    throw new Error('Title is required');
  }

  // Type-specific validation
  if (formData.productType === 'DROPSHIP' && !formData.externalSupplierUrl) {
    throw new Error('Supplier URL required for dropship products');
  }

  if (formData.productType === 'OWN' && (formData.inventoryQty == null || formData.inventoryQty < 0)) {
    throw new Error('Inventory quantity required for own products');
  }

  // Ensure at least one variant
  if (!formData.variants || formData.variants.length === 0) {
    throw new Error('At least one variant is required');
  }

  try {
    // Create product
    const [product] = await db
      .insert(products)
      .values({
        userId: session.user.id,
        title: formData.title,
        description: formData.description || null,
        productType: formData.productType,
        status: formData.status,
        defaultImageUrl: formData.defaultImageUrl || null,
      })
      .returning();

    // Create source if needed
    if (formData.productType === 'POD' || formData.productType === 'DROPSHIP' || formData.productType === 'OWN') {
      await db.insert(productSources).values({
        productId: product.id,
        provider: formData.provider || null,
        providerSku: formData.providerSku || null,
        externalSupplierUrl: formData.externalSupplierUrl || null,
        leadTimeDays: formData.leadTimeDays || null,
        inventoryQty: formData.inventoryQty || null,
        weightG: formData.weightG || null,
      });
    }

    // Create variants
    for (const variant of formData.variants) {
      await db.insert(productVariants).values({
        productId: product.id,
        sku: variant.sku || null,
        optionsJson: variant.optionsJson || null,
        costCents: variant.costCents,
        priceCents: variant.priceCents,
      });
    }

    revalidatePath('/dashboard/products');
    return { success: true, productId: product.id };
  } catch (error) {
    console.error('Create product error:', error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(productId: string, formData: ProductFormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existingProduct || existingProduct.userId !== session.user.id) {
    throw new Error('Product not found or unauthorized');
  }

  // Validate
  if (!formData.title) {
    throw new Error('Title is required');
  }

  if (formData.productType === 'DROPSHIP' && !formData.externalSupplierUrl) {
    throw new Error('Supplier URL required for dropship products');
  }

  if (formData.productType === 'OWN' && (formData.inventoryQty == null || formData.inventoryQty < 0)) {
    throw new Error('Inventory quantity required for own products');
  }

  if (!formData.variants || formData.variants.length === 0) {
    throw new Error('At least one variant is required');
  }

  try {
    // Update product
    await db
      .update(products)
      .set({
        title: formData.title,
        description: formData.description || null,
        productType: formData.productType,
        status: formData.status,
        defaultImageUrl: formData.defaultImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Update or create source
    const [existingSource] = await db
      .select()
      .from(productSources)
      .where(eq(productSources.productId, productId))
      .limit(1);

    if (existingSource) {
      await db
        .update(productSources)
        .set({
          provider: formData.provider || null,
          providerSku: formData.providerSku || null,
          externalSupplierUrl: formData.externalSupplierUrl || null,
          leadTimeDays: formData.leadTimeDays || null,
          inventoryQty: formData.inventoryQty || null,
          weightG: formData.weightG || null,
        })
        .where(eq(productSources.id, existingSource.id));
    } else {
      await db.insert(productSources).values({
        productId: productId,
        provider: formData.provider || null,
        providerSku: formData.providerSku || null,
        externalSupplierUrl: formData.externalSupplierUrl || null,
        leadTimeDays: formData.leadTimeDays || null,
        inventoryQty: formData.inventoryQty || null,
        weightG: formData.weightG || null,
      });
    }

    // Delete existing variants and recreate (simple approach for MVP)
    await db.delete(productVariants).where(eq(productVariants.productId, productId));

    for (const variant of formData.variants) {
      await db.insert(productVariants).values({
        productId: productId,
        sku: variant.sku || null,
        optionsJson: variant.optionsJson || null,
        costCents: variant.costCents,
        priceCents: variant.priceCents,
      });
    }

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error('Update product error:', error);
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(productId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existingProduct || existingProduct.userId !== session.user.id) {
    throw new Error('Product not found or unauthorized');
  }

  try {
    // Delete product (cascade will handle variants and sources)
    await db.delete(products).where(eq(products.id, productId));

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Delete product error:', error);
    throw new Error('Failed to delete product');
  }
}

export async function duplicateProduct(productId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get existing product
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existingProduct || existingProduct.userId !== session.user.id) {
    throw new Error('Product not found or unauthorized');
  }

  try {
    // Get source and variants
    const [source] = await db
      .select()
      .from(productSources)
      .where(eq(productSources.productId, productId))
      .limit(1);

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    // Create duplicate
    const [newProduct] = await db
      .insert(products)
      .values({
        userId: session.user.id,
        title: `${existingProduct.title} (Copy)`,
        description: existingProduct.description,
        productType: existingProduct.productType,
        status: 'DRAFT', // Always set to draft
        defaultImageUrl: existingProduct.defaultImageUrl,
      })
      .returning();

    // Duplicate source
    if (source) {
      await db.insert(productSources).values({
        productId: newProduct.id,
        provider: source.provider,
        providerSku: source.providerSku,
        externalSupplierUrl: source.externalSupplierUrl,
        leadTimeDays: source.leadTimeDays,
        inventoryQty: source.inventoryQty,
        weightG: source.weightG,
      });
    }

    // Duplicate variants
    for (const variant of variants) {
      await db.insert(productVariants).values({
        productId: newProduct.id,
        sku: variant.sku,
        optionsJson: variant.optionsJson,
        costCents: variant.costCents,
        priceCents: variant.priceCents,
      });
    }

    revalidatePath('/dashboard/products');
    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Duplicate product error:', error);
    throw new Error('Failed to duplicate product');
  }
}
