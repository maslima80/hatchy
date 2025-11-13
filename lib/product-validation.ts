/**
 * Product validation utilities
 * Used before publishing products to ensure data integrity
 */

import { db } from './db';
import { products, variants } from './db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a product before publishing
 * Checks for required fields, variants, pricing, etc.
 */
export async function validateProductForPublish(
  productId: string,
  userId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Get product
  const [product] = await db
    .select()
    .from(products)
    .where(and(
      eq(products.id, productId),
      eq(products.userId, userId),
      isNull(products.deletedAt)
    ));

  if (!product) {
    return {
      valid: false,
      errors: [{ field: 'product', message: 'Product not found' }],
    };
  }

  // Check basic required fields
  if (!product.title || product.title.trim() === '') {
    errors.push({ field: 'title', message: 'Product title is required' });
  }

  if (!product.description || product.description.trim() === '') {
    errors.push({ field: 'description', message: 'Product description is required' });
  }

  // Check variants if variations are enabled
  if (product.variationsEnabled) {
    const [variantCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(variants)
      .where(and(
        eq(variants.productId, productId),
        isNull(variants.deletedAt)
      ));

    if (variantCount.count === 0) {
      errors.push({
        field: 'variants',
        message: 'Please add at least one variant before publishing, or disable variations',
      });
    }
  } else {
    // For simple products, check if default variant has price
    const [defaultVariant] = await db
      .select()
      .from(variants)
      .where(and(
        eq(variants.productId, productId),
        isNull(variants.deletedAt)
      ))
      .limit(1);

    if (!defaultVariant || (!defaultVariant.priceCents && defaultVariant.priceCents !== 0)) {
      errors.push({
        field: 'price',
        message: 'Product price is required',
      });
    }
  }

  // Check for at least one image (optional but recommended)
  // TODO: Add product_media check when implemented

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get user-friendly validation message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }

  return `Please fix the following issues:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}

/**
 * Quick check if product can be published
 */
export async function canPublishProduct(
  productId: string,
  userId: string
): Promise<boolean> {
  const result = await validateProductForPublish(productId, userId);
  return result.valid;
}
