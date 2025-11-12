import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Update brand
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [updated] = await db
      .update(brands)
      .set({ name: name.trim(), slug })
      .where(and(eq(brands.id, id), eq(brands.userId, session.user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update brand error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update brand' },
      { status: 500 }
    );
  }
}

// Delete brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete brand error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete brand' },
      { status: 500 }
    );
  }
}
