import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getShopProducts } from '@/lib/printify';

/**
 * GET /api/integrations/printify/shops/[shopId]/products
 * Get all products for a specific shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopId } = await params;

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

    // Fetch products
    const products = await getShopProducts(connection.apiKey, shopId);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Get Printify products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
