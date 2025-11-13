import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { productOptions, productOptionValues, products } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/products/[id]/options/[optionId]/values
 * List all values for an option
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, optionId } = await params;

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, session.user.id),
          isNull(products.deletedAt)
        )
      );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify option belongs to product
    const [option] = await db
      .select()
      .from(productOptions)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId)
        )
      );

    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Get values
    const values = await db
      .select()
      .from(productOptionValues)
      .where(eq(productOptionValues.optionId, optionId))
      .orderBy(productOptionValues.position);

    return NextResponse.json({ values });
  } catch (error) {
    console.error('Error fetching option values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch option values' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/options/[optionId]/values
 * Add a value to an option
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, optionId } = await params;
    const body = await request.json();
    const { value, position } = body;

    if (!value || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, session.user.id),
          isNull(products.deletedAt)
        )
      );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify option belongs to product
    const [option] = await db
      .select()
      .from(productOptions)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId)
        )
      );

    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Create value
    const [created] = await db
      .insert(productOptionValues)
      .values({
        optionId,
        value: value.trim(),
        position: position || 0,
      })
      .returning();

    return NextResponse.json({ value: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating option value:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This value already exists for this option' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create option value' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/options/[optionId]/values
 * Delete a value from an option
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId, optionId } = await params;
    const body = await request.json();
    const { id: valueId } = body;

    if (!valueId) {
      return NextResponse.json(
        { error: 'Value ID is required' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, session.user.id),
          isNull(products.deletedAt)
        )
      );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify option belongs to product
    const [option] = await db
      .select()
      .from(productOptions)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId)
        )
      );

    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Delete value
    await db
      .delete(productOptionValues)
      .where(
        and(
          eq(productOptionValues.id, valueId),
          eq(productOptionValues.optionId, optionId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting option value:', error);
    return NextResponse.json(
      { error: 'Failed to delete option value' },
      { status: 500 }
    );
  }
}
