import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { upsertVariant, deleteVariant } from '@/lib/variants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const variant = await upsertVariant(
      params.id,
      { id: params.variantId, ...body },
      session.user.id
    );

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    console.error('Update variant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update variant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteVariant(params.variantId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete variant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
