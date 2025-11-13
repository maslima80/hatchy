import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { testApiKey } from '@/lib/printify';

/**
 * POST /api/integrations/printify/connect
 * Connect or update Printify API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key
    const testResult = await testApiKey(apiKey);
    
    if (!testResult.valid) {
      return NextResponse.json(
        { error: testResult.error || 'Invalid API key' },
        { status: 400 }
      );
    }

    // Get default shop (first shop)
    const defaultShopId = testResult.shops && testResult.shops.length > 0
      ? String(testResult.shops[0].id)
      : null;

    // Upsert connection
    const [connection] = await db
      .insert(printifyConnections)
      .values({
        userId: session.user.id,
        apiKey,
        defaultShopId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: printifyConnections.userId,
        set: {
          apiKey,
          defaultShopId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      shops: testResult.shops,
      defaultShopId,
      message: 'Printify account connected successfully',
    });
  } catch (error: any) {
    console.error('Printify connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Printify account' },
      { status: 500 }
    );
  }
}
