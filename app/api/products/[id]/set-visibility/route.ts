import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { assertBelongsToUser } from '@/lib/products';
import { canSetVisible } from '@/lib/pricing';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, visibility } = await request.json();

    // Verify product ownership
    await assertBelongsToUser(params.id, session.user.id);

    // If setting to VISIBLE, check price > 0
    if (visibility === 'VISIBLE') {
      const canBeVisible = await canSetVisible(storeId, params.id);
      if (!canBeVisible) {
        return NextResponse.json(
          { error: 'Cannot set to VISIBLE: price must be > 0' },
          { status: 400 }
        );
      }
    }

    // Update visibility
    await db
      .update(storeProducts)
      .set({ visibility })
      .where(
        and(
          eq(storeProducts.storeId, storeId),
          eq(storeProducts.productId, params.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Set visibility error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set visibility' },
      { status: 500 }
    );
  }
}
