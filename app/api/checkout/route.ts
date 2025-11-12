import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/checkout';
import { z } from 'zod';

const checkoutSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).optional().default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, productId, quantity } = checkoutSchema.parse(body);

    // Get base URL from request
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

    // Create checkout session
    const url = await createCheckoutSession({
      storeId,
      productId,
      quantity,
      baseUrl,
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Checkout error:', error);

    // Return user-friendly error messages
    const message = error.message || 'Failed to create checkout session';
    const status = message.includes('not found') ? 404 : message.includes('not configured') || message.includes('not available') ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
