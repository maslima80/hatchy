import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getShops } from '@/lib/printify';

/**
 * GET /api/integrations/printify/shops
 * Get all shops for the connected Printify account
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get connection
    const [connection] = await db
      .select()
      .from(printifyConnections)
      .where(eq(printifyConnections.userId, session.user.id));

    if (!connection) {
      return NextResponse.json(
        { error: 'No Printify connection found' },
        { status: 404 }
      );
    }

    // Fetch shops
    const shops = await getShops(connection.apiKey);

    return NextResponse.json({
      shops,
      defaultShopId: connection.defaultShopId,
    });
  } catch (error: any) {
    console.error('Get Printify shops error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}
