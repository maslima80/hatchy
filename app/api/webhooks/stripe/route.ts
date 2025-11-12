import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateAccountStatus } from '@/lib/payouts';
import { db } from '@/lib/db';
import { orders, pendingOrders, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Log all incoming events for debugging
  console.log(`[Webhook] Received event: ${event.type}`, {
    id: event.id,
    created: new Date(event.created * 1000).toISOString(),
  });

  // Handle the event
  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('[Webhook] Account updated:', {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        });
        
        await updateAccountStatus(account.id, event.type);
        console.log('[Webhook] Account status updated in database');
        break;
      }

      case 'account.application.authorized':
      case 'account.application.deauthorized':
      case 'account.external_account.created':
      case 'account.external_account.deleted':
      case 'account.external_account.updated': {
        const account = event.data.object as any;
        const accountId = account.account || account.id;
        
        if (accountId) {
          console.log(`Account event ${event.type}:`, accountId);
          await updateAccountStatus(accountId, event.type);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout session completed:', {
          sessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
          metadata: session.metadata,
        });

        // Get metadata
        const storeId = session.metadata?.storeId;
        const productId = session.metadata?.productId;

        if (!storeId || !productId) {
          console.error('Missing metadata in session:', session.id);
          break;
        }

        // Get store to find owner
        const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);

        if (!store) {
          console.error('Store not found:', storeId);
          break;
        }

        // Check if order already exists
        const [existingOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.stripeSessionId, session.id))
          .limit(1);

        if (existingOrder) {
          console.log('Order already exists:', existingOrder.id);
          break;
        }

        // Get pending order for stripe account ID
        const [pendingOrder] = await db
          .select()
          .from(pendingOrders)
          .where(eq(pendingOrders.stripeSessionId, session.id))
          .limit(1);

        if (!pendingOrder) {
          console.error('Pending order not found:', session.id);
          break;
        }

        const stripeAccountId = pendingOrder.stripeAccountId;

        // Create order
        await db.insert(orders).values({
          userId: store.userId,
          storeId,
          productId,
          stripeAccountId,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string | null,
          amountCents: session.amount_total || 0,
          currency: session.currency || 'usd',
          customerEmail: session.customer_details?.email || null,
          status: 'paid',
        });

        // Delete pending order
        await db.delete(pendingOrders).where(eq(pendingOrders.stripeSessionId, session.id));

        console.log('[Webhook] Order created successfully:', {
          sessionId: session.id,
          storeId,
          productId,
          amount: session.amount_total,
        });
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout session payment failed:', {
          sessionId: session.id,
          metadata: session.metadata,
        });

        // Update order status to failed if exists
        await db
          .update(orders)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(orders.stripeSessionId, session.id));

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
