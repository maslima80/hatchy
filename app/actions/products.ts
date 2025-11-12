'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { upsertProduct, deleteProduct as deleteProductUtil, getProductById } from '@/lib/products';
import { upsertVariant } from '@/lib/variants';

export type ProductFormData = {
  title: string;
  description?: string;
  type: 'OWN' | 'POD' | 'DIGITAL';
  status: 'DRAFT' | 'READY';
  defaultImageUrl?: string;
  weightGrams?: number;
  // Variants
  variants: Array<{
    id?: string;
    sku?: string;
    optionsJson?: string;
    costCents?: number;
    priceCents?: number;
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

  // Ensure at least one variant
  if (!formData.variants || formData.variants.length === 0) {
    throw new Error('At least one variant is required');
  }

  try {
    // Create product using utility
    console.log('Creating product with data:', {
      title: formData.title,
      type: formData.type,
      status: formData.status,
    });
    
    const product = await upsertProduct(
      {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        defaultImageUrl: formData.defaultImageUrl,
        weightGrams: formData.weightGrams,
      },
      session.user.id
    );

    console.log('Product created:', product.id);

    // Create variants
    for (const variant of formData.variants) {
      console.log('Creating variant:', variant);
      await upsertVariant(
        product.id,
        {
          sku: variant.sku,
          optionsJson: variant.optionsJson,
          costCents: variant.costCents,
          priceCents: variant.priceCents,
        },
        session.user.id
      );
    }

    console.log('Product and variants created successfully');
    revalidatePath('/dashboard/products');
    return { success: true, productId: product.id };
  } catch (error: any) {
    console.error('Create product error:', error);
    console.error('Error details:', error.message, error.stack);
    throw new Error(error.message || 'Failed to create product');
  }
}

export async function updateProduct(productId: string, formData: ProductFormData) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate
  if (!formData.title) {
    throw new Error('Title is required');
  }

  if (!formData.variants || formData.variants.length === 0) {
    throw new Error('At least one variant is required');
  }

  try {
    // Update product using utility
    await upsertProduct(
      {
        id: productId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        defaultImageUrl: formData.defaultImageUrl,
        weightGrams: formData.weightGrams,
      },
      session.user.id
    );

    // Update variants (simplified - in production you'd handle updates better)
    for (const variant of formData.variants) {
      await upsertVariant(
        productId,
        {
          id: variant.id,
          sku: variant.sku,
          optionsJson: variant.optionsJson,
          costCents: variant.costCents,
          priceCents: variant.priceCents,
        },
        session.user.id
      );
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

  try {
    // Soft delete using utility
    await deleteProductUtil(productId, session.user.id);

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

  try {
    // Get existing product with relations
    const existingProduct = await getProductById(productId, session.user.id);
    
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Create duplicate
    const newProduct = await upsertProduct(
      {
        title: `${existingProduct.title} (Copy)`,
        description: existingProduct.description || undefined,
        type: existingProduct.type,
        status: 'DRAFT', // Always set to draft
        defaultImageUrl: existingProduct.defaultImageUrl || undefined,
        weightGrams: existingProduct.weightGrams || undefined,
      },
      session.user.id
    );

    // Duplicate variants
    if (existingProduct.variants) {
      for (const variant of existingProduct.variants) {
        await upsertVariant(
          newProduct.id,
          {
            sku: variant.sku || undefined,
            optionsJson: variant.optionsJson || undefined,
            costCents: variant.costCents || undefined,
            priceCents: variant.priceCents || undefined,
          },
          session.user.id
        );
      }
    }

    revalidatePath('/dashboard/products');
    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Duplicate product error:', error);
    throw new Error('Failed to duplicate product');
  }
}
