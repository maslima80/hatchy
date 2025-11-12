import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeProducts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { assertBelongsToUser } from '@/lib/products';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await request.json();

    // Verify product ownership
    await assertBelongsToUser(params.id, session.user.id);

    // Verify store ownership
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId));

    if (!store || store.userId !== session.user.id) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if already attached
    const [existing] = await db
      .select()
      .from(storeProducts)
      .where(
        and(
          eq(storeProducts.storeId, storeId),
          eq(storeProducts.productId, params.id)
        )
      );

    if (existing) {
      return NextResponse.json({ error: 'Already attached' }, { status: 400 });
    }

    // Attach product to store
    await db.insert(storeProducts).values({
      storeId,
      productId: params.id,
      visibility: 'HIDDEN',
      position: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Attach store error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to attach store' },
      { status: 500 }
    );
  }
}
