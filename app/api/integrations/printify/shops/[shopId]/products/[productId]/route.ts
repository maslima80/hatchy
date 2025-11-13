import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getProductDetails } from '@/lib/printify';

/**
 * GET /api/integrations/printify/shops/[shopId]/products/[productId]
 * Get detailed information about a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; productId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopId, productId } = await params;

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

    // Fetch product details
    const product = await getProductDetails(connection.apiKey, shopId, productId);

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Get Printify product details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}
