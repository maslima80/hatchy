import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeProducts, products, storePrices, productVariants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToastProvider } from '@/components/ui/toast';
import { PriceTable } from './components/PriceTable';

export default async function StorePricingPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  // Fetch store
  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, params.id), eq(stores.userId, session!.user.id)))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Fetch store products with prices
  const storeProductsList = await db
    .select({
      storeProduct: storeProducts,
      product: products,
      storePrice: storePrices,
    })
    .from(storeProducts)
    .innerJoin(products, eq(storeProducts.productId, products.id))
    .leftJoin(storePrices, eq(storePrices.storeProductId, storeProducts.id))
    .where(eq(storeProducts.storeId, params.id))
    .orderBy(storeProducts.position);

  // Get default prices from product variants
  const productsWithPrices = await Promise.all(
    storeProductsList.map(async (item) => {
      const [defaultVariant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, item.product.id))
        .limit(1);

      return {
        ...item,
        defaultPrice: defaultVariant?.priceCents || 0,
      };
    })
  );

  return (
    <ToastProvider>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/dashboard/stores" className="hover:text-gray-900">
            Stores
          </Link>
          <span>/</span>
          <Link href={`/dashboard/stores/${store.id}`} className="hover:text-gray-900">
            {store.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Pricing</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/stores/${store.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-[#111]">Pricing</h1>
                <p className="text-gray-600 mt-1">Manage prices and visibility for {store.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Table */}
        {productsWithPrices.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No products attached to this store yet.</p>
            <Link href={`/dashboard/stores/${store.id}`}>
              <Button className="mt-4">Add Products</Button>
            </Link>
          </Card>
        ) : (
          <PriceTable storeId={store.id} products={productsWithPrices} />
        )}
      </div>
    </ToastProvider>
  );
}
