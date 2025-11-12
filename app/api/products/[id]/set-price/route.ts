import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setStorePrice } from '@/lib/pricing';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, priceCents, currency, variantId } = await request.json();

    await setStorePrice({
      storeId,
      productId: params.id,
      variantId,
      priceCents,
      currency,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Set price error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set price' },
      { status: 500 }
    );
  }
}
