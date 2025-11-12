'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function updateOrderNotes(orderId: string, notes: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify order belongs to user
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order) {
    throw new Error('Order not found');
  }

  // Update notes
  await db
    .update(orders)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/dashboard/orders/${orderId}`);
  return { success: true };
}
