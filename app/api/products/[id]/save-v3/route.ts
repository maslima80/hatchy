import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, variants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { attachCategoriesToProduct } from '@/lib/categories';
import { attachTagsToProduct } from '@/lib/tags';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await params;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product with all v3 fields
    await db
      .update(products)
      .set({
        title: body.title,
        description: body.description,
        type: body.type,
        status: body.status,
        youtubeUrl: body.youtubeUrl || null,
        compareAtPriceCents: body.compareAtPriceCents || null,
        unit: body.unit || 'Unit',
        trackInventory: body.trackInventory || false,
        quantity: body.quantity || 0,
        personalizationEnabled: body.personalizationEnabled || false,
        personalizationPrompt: body.personalizationPrompt || null,
        brandId: body.brandId || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Update categories
    if (body.categoryIds !== undefined) {
      await attachCategoriesToProduct(id, body.categoryIds, session.user.id);
    }

    // Update tags
    if (body.tagIds !== undefined) {
      await attachTagsToProduct(id, body.tagIds, session.user.id);
    }

    // Update default variant pricing if provided
    if (body.priceCents !== undefined || body.sku !== undefined) {
      const [defaultVariant] = await db
        .select()
        .from(variants)
        .where(eq(variants.productId, id))
        .limit(1);

      if (defaultVariant) {
        await db
          .update(variants)
          .set({
            priceCents: body.priceCents,
            sku: body.sku,
            updatedAt: new Date(),
          })
          .where(eq(variants.id, defaultVariant.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save product v3 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}
