import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeProducts } from '@/lib/db/schema';
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

    // Detach product from store
    await db
      .delete(storeProducts)
      .where(
        and(
          eq(storeProducts.storeId, storeId),
          eq(storeProducts.productId, params.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Detach store error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detach store' },
      { status: 500 }
    );
  }
}
