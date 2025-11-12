import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { upsertProduct } from '@/lib/products';
import { attachCategoriesToProduct } from '@/lib/categories';
import { attachTagsToProduct } from '@/lib/tags';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryIds, tagIds, ...productData } = body;

    // Update product
    const product = await upsertProduct(
      {
        id: params.id,
        ...productData,
      },
      session.user.id
    );

    // Update categories
    if (categoryIds !== undefined) {
      await attachCategoriesToProduct(params.id, categoryIds, session.user.id);
    }

    // Update tags
    if (tagIds !== undefined) {
      await attachTagsToProduct(params.id, tagIds, session.user.id);
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
