import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { upsertVariant } from '@/lib/variants';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const variant = await upsertVariant(params.id, body, session.user.id);

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    console.error('Create variant error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}
