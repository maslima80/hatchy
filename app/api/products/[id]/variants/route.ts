import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProductVariants, upsertVariant } from '@/lib/variants';

/**
 * GET /api/products/[id]/variants
 * List all variants for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const variants = await getProductVariants(productId, session.user.id);

    return NextResponse.json({ variants });
  } catch (error: any) {
    console.error('Get variants error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get variants' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    
    const variant = await upsertVariant(productId, body, session.user.id);

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    console.error('Create variant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}
