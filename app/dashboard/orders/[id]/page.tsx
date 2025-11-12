import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, stores, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { OrderNotesForm } from './components/OrderNotesForm';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  // Fetch order with store and product
  const [orderData] = await db
    .select({
      order: orders,
      store: stores,
      product: products,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .where(and(eq(orders.id, params.id), eq(orders.userId, session!.user.id)))
    .limit(1);

  if (!orderData) {
    notFound();
  }

  const { order, store, product } = orderData;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Order Details</h1>
          <p className="text-gray-600 mt-1">Order placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Information</CardTitle>
            <Badge
              variant={order.status === 'paid' ? 'default' : order.status === 'failed' ? 'destructive' : 'outline'}
            >
              {order.status}
            </Badge>
          </div>
          <CardDescription>Order ID: {order.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store & Product */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Store</h3>
              <div className="flex items-center gap-3">
                {store.heroImageUrl && (
                  <img src={store.heroImageUrl} alt={store.name} className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{store.name}</p>
                  <Link
                    href={`/s/${store.slug}`}
                    target="_blank"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View store <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Product</h3>
              <div className="flex items-center gap-3">
                {product.defaultImageUrl && (
                  <img src={product.defaultImageUrl} alt={product.title} className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {product.productType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${(order.amountCents / 100).toFixed(2)} {order.currency.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Email</p>
                <p className="text-sm text-gray-900">{order.customerEmail || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stripe Session ID</p>
                <p className="text-xs font-mono text-gray-700">{order.stripeSessionId}</p>
              </div>
              {order.stripePaymentIntentId && (
                <div>
                  <p className="text-sm text-gray-600">Payment Intent ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-gray-700">{order.stripePaymentIntentId}</p>
                    <a
                      href={`https://dashboard.stripe.com/${order.stripeAccountId}/payments/${order.stripePaymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Stripe Account</p>
                <p className="text-xs font-mono text-gray-700">{order.stripeAccountId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Stripe Dashboard Link */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-2">
              View this payment in your Stripe Express dashboard to see payout details.
            </p>
            <Link href="/dashboard/settings">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Stripe Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
          <CardDescription>Add internal notes about this order</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderNotesForm orderId={order.id} initialNotes={order.notes || ''} />
        </CardContent>
      </Card>
    </div>
  );
}
