import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/integrations/printify/set-shop
 * Set default shop for Printify connection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Update connection
    await db
      .update(printifyConnections)
      .set({
        defaultShopId: String(shopId),
        updatedAt: new Date(),
      })
      .where(eq(printifyConnections.userId, session.user.id));

    return NextResponse.json({
      success: true,
      message: 'Default shop updated',
    });
  } catch (error: any) {
    console.error('Set Printify shop error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set default shop' },
      { status: 500 }
    );
  }
}
