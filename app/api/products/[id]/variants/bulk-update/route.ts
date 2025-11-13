import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, variants } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

/**
 * PATCH /api/products/[id]/variants/bulk-update
 * Update multiple variants at once
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { variantIds, updates } = body;

    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json(
        { error: 'variantIds array is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, session.user.id),
          isNull(products.deletedAt)
        )
      );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify all variants belong to this product
    const variantsToUpdate = await db
      .select()
      .from(variants)
      .where(
        and(
          inArray(variants.id, variantIds),
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        )
      );

    if (variantsToUpdate.length !== variantIds.length) {
      return NextResponse.json(
        { error: 'Some variants not found or do not belong to this product' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.priceCents !== undefined) {
      updateData.priceCents = updates.priceCents;
    }
    if (updates.costCents !== undefined) {
      updateData.costCents = updates.costCents;
    }
    if (updates.stock !== undefined) {
      updateData.stock = updates.stock;
    }

    // Perform bulk update
    await db
      .update(variants)
      .set(updateData)
      .where(
        and(
          inArray(variants.id, variantIds),
          eq(variants.productId, productId)
        )
      );

    // Fetch updated variants
    const updatedVariants = await db
      .select()
      .from(variants)
      .where(
        and(
          inArray(variants.id, variantIds),
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        )
      );

    return NextResponse.json({
      message: `Updated ${updatedVariants.length} variant(s)`,
      variants: updatedVariants,
    });
  } catch (error) {
    console.error('Error bulk updating variants:', error);
    return NextResponse.json(
      { error: 'Failed to update variants' },
      { status: 500 }
    );
  }
}
