import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Plus, Edit } from 'lucide-react';
import { ProductActions } from './components/ProductActions';

export default async function ProductsPage() {
  const session = await getSession();
  
  // Fetch products for this user
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.userId, session!.user.id))
    .orderBy(desc(products.createdAt));

  // Get variant counts for each product
  const productIds = userProducts.map(p => p.id);
  const variantCounts: Record<string, number> = {};
  
  if (productIds.length > 0) {
    const allVariants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productIds[0])); // Simplified for MVP
    
    for (const variant of allVariants) {
      variantCounts[variant.productId] = (variantCounts[variant.productId] || 0) + 1;
    }
  }

  const hasProducts = userProducts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {!hasProducts ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Start by adding your first product. You can add POD items, dropship products, or your own creations.
            </p>
            <Link href="/dashboard/products/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Products Table */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Title</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Type</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Status</th>
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Variants</th>
                  <th className="text-right p-4 font-medium text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{product.title}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          product.productType === 'POD'
                            ? 'default'
                            : product.productType === 'DROPSHIP'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {product.productType}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={product.status === 'READY' ? 'default' : 'outline'}>
                        {product.status === 'READY' ? '✅ Ready' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-600">
                      {variantCounts[product.id] || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <ProductActions productId={product.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
