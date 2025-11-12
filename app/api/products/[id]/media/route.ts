import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productMedia } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Add media to product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, alt } = await request.json();
    const { id } = await params;

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get current max position
    const existingMedia = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, id));

    const maxPosition = existingMedia.length > 0
      ? Math.max(...existingMedia.map(m => m.position))
      : -1;

    // Insert new media
    const [newMedia] = await db
      .insert(productMedia)
      .values({
        productId: id,
        url,
        alt: alt || null,
        position: maxPosition + 1,
      })
      .returning();

    // If this is the first image, set as default
    if (existingMedia.length === 0) {
      await db
        .update(products)
        .set({ defaultImageUrl: url })
        .where(eq(products.id, id));
    }

    return NextResponse.json({ success: true, media: newMedia });
  } catch (error: any) {
    console.error('Add media error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add media' },
      { status: 500 }
    );
  }
}

// Get all media for product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const media = await db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, id))
      .orderBy(productMedia.position);

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error('Get media error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get media' },
      { status: 500 }
    );
  }
}

// Delete media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await request.json();

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete media
    await db
      .delete(productMedia)
      .where(
        and(
          eq(productMedia.id, mediaId),
          eq(productMedia.productId, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete media error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete media' },
      { status: 500 }
    );
  }
}
