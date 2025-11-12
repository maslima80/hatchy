import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, stores, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import Link from 'next/link';

export default async function OrdersPage() {
  const session = await getSession();

  // Fetch orders for current user
  const userOrders = await db
    .select({
      order: orders,
      store: stores,
      product: products,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.userId, session!.user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111]">Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage your orders</p>
      </div>

      {userOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              Once customers start purchasing from your stores, their orders will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userOrders.map(({ order, store, product }) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{store.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(order.amountCents / 100).toFixed(2)} {order.currency.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.customerEmail || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            order.status === 'paid' ? 'default' : order.status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-blue-600 hover:text-blue-800">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
