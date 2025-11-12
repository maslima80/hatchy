import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Update tag
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
      .update(tags)
      .set({ name: name.trim(), slug })
      .where(and(eq(tags.id, id), eq(tags.userId, session.user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update tag error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// Delete tag
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
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
