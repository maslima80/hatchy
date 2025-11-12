import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { storeProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { assertBelongsToUser } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify product ownership
    await assertBelongsToUser(params.id, session.user.id);

    // Fetch store products
    const sp = await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.productId, params.id));

    return NextResponse.json(sp);
  } catch (error: any) {
    console.error('Fetch store products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store products' },
      { status: 500 }
    );
  }
}
