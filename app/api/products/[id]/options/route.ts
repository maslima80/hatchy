import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { productOptions, productOptionValues, products } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * GET /api/products/[id]/options
 * List all option groups and their values for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

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

    // Get all options for this product
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(productOptions.position);

    // Get all values for these options
    const optionIds = options.map(opt => opt.id);
    const values = optionIds.length > 0
      ? await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, optionIds[0])) // We'll fetch all in a better way
      : [];

    // Group values by option
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const optionValues = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(productOptionValues.position);

        return {
          ...option,
          values: optionValues,
        };
      })
    );

    return NextResponse.json({ options: optionsWithValues });
  } catch (error) {
    console.error('Error fetching options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/options
 * Create a new option group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { name, position } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Option name is required' },
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

    // Create option
    const [option] = await db
      .insert(productOptions)
      .values({
        productId,
        name: name.trim(),
        position: position || 0,
      })
      .returning();

    return NextResponse.json({ option }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating option:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An option with this name already exists for this product' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create option' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]/options
 * Update an option group
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { id: optionId, name, position } = body;

    if (!optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
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

    // Update option
    const updates: any = { updatedAt: new Date() };
    if (name) updates.name = name.trim();
    if (position !== undefined) updates.position = position;

    const [updated] = await db
      .update(productOptions)
      .set(updates)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    return NextResponse.json({ option: updated });
  } catch (error: any) {
    console.error('Error updating option:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An option with this name already exists for this product' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update option' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/options
 * Delete an option group (cascades to values and regenerates variants)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { id: optionId } = body;

    if (!optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
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

    // Delete option (cascades to values via ON DELETE CASCADE)
    await db
      .delete(productOptions)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting option:', error);
    return NextResponse.json(
      { error: 'Failed to delete option' },
      { status: 500 }
    );
  }
}
