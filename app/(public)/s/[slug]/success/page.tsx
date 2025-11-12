import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, orders, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { session_id?: string };
}) {
  const { slug } = await params;
  const sessionId = searchParams.session_id;

  // Fetch store
  const [store] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);

  if (!store) {
    notFound();
  }

  // If no session_id, show generic success
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">Thank you for your purchase.</p>
              <Link href={`/s/${slug}`}>
                <Button className="w-full">Back to Store</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch order by session ID
  const [orderData] = await db
    .select({
      order: orders,
      product: products,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-2">Your order is being processed.</p>
              <p className="text-sm text-gray-500 mb-6">You'll receive a confirmation email shortly.</p>
              <Link href={`/s/${slug}`}>
                <Button className="w-full">Back to Store</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, product } = orderData;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">Thank you for your purchase from {store.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Product */}
            <div className="flex items-center gap-4 pb-4 border-b">
              {product.defaultImageUrl && (
                <img
                  src={product.defaultImageUrl}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{product.title}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3 py-4 border-b">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID</span>
                <span className="font-mono text-xs text-gray-900">{order.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-semibold text-gray-900">
                  ${(order.amountCents / 100).toFixed(2)} {order.currency.toUpperCase()}
                </span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confirmation Email</span>
                  <span className="text-gray-900">{order.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Date</span>
                <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="pt-4">
              <h3 className="font-medium text-gray-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ You'll receive a confirmation email at {order.customerEmail || 'your email'}</li>
                <li>✓ The seller will process your order shortly</li>
                <li>✓ You'll be contacted with shipping/delivery details</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Link href={`/s/${slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Store
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Questions about your order? Contact the seller directly.</p>
        </div>
      </div>
    </div>
  );
}
