import Link from 'next/link';
import { getSession, getUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ShoppingBag, Store, Package, DollarSign } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  const profile = await getUserProfile(session!.user.id);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111]">
          Welcome back, {profile?.name || 'there'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Ready to launch something amazing?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/products/new">
          <Card className="hover:border-[#6C5CE7] transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#6C5CE7]/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-[#6C5CE7]" />
                </div>
                <div>
                  <CardTitle>Add Product</CardTitle>
                  <CardDescription>Create your first product</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/stores/new">
          <Card className="hover:border-[#6C5CE7] transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#6C5CE7]/10 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-[#6C5CE7]" />
                </div>
                <div>
                  <CardTitle>Create Store</CardTitle>
                  <CardDescription>Launch a new micro-store</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenue (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold">$0.00</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">No sales yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold">0</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Start selling to see orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-400" />
              <span className="text-2xl font-bold">0</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Add your first product</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to launch your first store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#6C5CE7] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add your first product</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Upload photos, set your price, and describe what you're selling.
                </p>
                <Link href="/dashboard/products/new">
                  <Button size="sm">Add Product</Button>
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create your store</h3>
                <p className="text-sm text-gray-600">
                  Pick a template and customize it with your products.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Connect Stripe</h3>
                <p className="text-sm text-gray-600">
                  Set up payments to start accepting orders.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
