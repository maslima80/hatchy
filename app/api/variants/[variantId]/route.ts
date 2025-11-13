import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { variants, products } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * PATCH /api/variants/[variantId]
 * Update a single variant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId } = await params;
    const body = await request.json();

    // Get variant and verify product ownership
    const [variant] = await db
      .select({
        variant: variants,
        product: products,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(
        and(
          eq(variants.id, variantId),
          isNull(variants.deletedAt),
          isNull(products.deletedAt)
        )
      );

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (variant.product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.priceCents !== undefined) updateData.priceCents = body.priceCents;
    if (body.costCents !== undefined) updateData.costCents = body.costCents;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    // Update variant
    const [updated] = await db
      .update(variants)
      .set(updateData)
      .where(eq(variants.id, variantId))
      .returning();

    return NextResponse.json({ variant: updated });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    
    // Handle unique constraint violation (duplicate SKU)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A variant with this SKU already exists for this product' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/variants/[variantId]
 * Soft delete a variant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId } = await params;

    // Get variant and verify product ownership
    const [variant] = await db
      .select({
        variant: variants,
        product: products,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(
        and(
          eq(variants.id, variantId),
          isNull(variants.deletedAt),
          isNull(products.deletedAt)
        )
      );

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (variant.product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete
    await db
      .update(variants)
      .set({ deletedAt: new Date() })
      .where(eq(variants.id, variantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
