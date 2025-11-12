import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's stores
    const userStores = await db
      .select()
      .from(stores)
      .where(eq(stores.userId, session.user.id));

    return NextResponse.json(userStores);
  } catch (error: any) {
    console.error('Fetch stores error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
