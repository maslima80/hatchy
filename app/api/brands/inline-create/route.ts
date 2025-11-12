import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { upsertBrand } from '@/lib/brands';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create or get existing brand
    const brand = await upsertBrand(name.trim(), session.user.id);

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    console.error('Inline create brand error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create brand' },
      { status: 500 }
    );
  }
}
