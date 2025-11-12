import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, storeProducts, products, storePrices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { BuyButton } from './components/BuyButton';
import { Suspense } from 'react';

export default async function PublicStorePage({ params }: { params: { slug: string } }) {
  // Fetch store
  const [store] = await db.select().from(stores).where(eq(stores.slug, params.slug)).limit(1);

  if (!store) {
    notFound();
  }

  const now = new Date();

  // Fetch store products with prices from pricebook
  const storeProductsList = await db
    .select({
      storeProduct: storeProducts,
      product: products,
      storePrice: storePrices,
    })
    .from(storeProducts)
    .innerJoin(products, eq(storeProducts.productId, products.id))
    .leftJoin(storePrices, eq(storePrices.storeProductId, storeProducts.id))
    .where(eq(storeProducts.storeId, store.id))
    .orderBy(storeProducts.position);

  // Filter visible products based on visibility and schedule
  const visibleProducts = storeProductsList.filter((item) => {
    if (!item.storePrice) return false;

    const visibility = item.storePrice.visibility;

    if (visibility === 'HIDDEN') return false;

    if (visibility === 'SCHEDULED') {
      // Check if within schedule window
      const startAt = item.storePrice.startAt;
      const endAt = item.storePrice.endAt;

      if (!startAt || !endAt) return false;

      return now >= startAt && now <= endAt;
    }

    return true; // VISIBLE
  });

  const storeProductsData = visibleProducts.map((sp) => sp.product);
  const productPrices: Record<string, { price: number; compareAt?: number }> = {};

  for (const item of visibleProducts) {
    if (item.storePrice) {
      productPrices[item.product.id] = {
        price: item.storePrice.priceCents,
        compareAt: item.storePrice.compareAtCents || undefined,
      };
    }
  }

  if (storeProductsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Coming Soon</h1>
          <p className="text-gray-600">This store is being set up. Check back soon!</p>
        </div>
      </div>
    );
  }

  // Render based on store type
  if (store.type === 'HOTSITE') {
    const product = storeProductsData[0];
    const price = productPrices[product.id];

    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        {store.heroImageUrl && (
          <div className="relative h-96 bg-gray-900">
            <img src={store.heroImageUrl} alt="Hero" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                {store.headline && <h1 className="text-5xl font-bold mb-4">{store.headline}</h1>}
                {store.subheadline && <p className="text-xl opacity-90">{store.subheadline}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Product Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div>
              {product.defaultImageUrl ? (
                <img
                  src={product.defaultImageUrl}
                  alt={product.title}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <Badge className="mb-4">{product.productType}</Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h2>
                {product.description && <p className="text-lg text-gray-600 leading-relaxed">{product.description}</p>}
              </div>

              {price && (
                <div className="space-y-2">
                  {price.compareAt && (
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-red-600">${(price.price / 100).toFixed(2)}</div>
                      <div className="text-xl text-gray-500 line-through">${(price.compareAt / 100).toFixed(2)}</div>
                      <Badge variant="destructive">On Sale</Badge>
                    </div>
                  )}
                  {!price.compareAt && (
                    <div className="text-3xl font-bold text-gray-900">${(price.price / 100).toFixed(2)}</div>
                  )}
                </div>
              )}

              <Suspense fallback={<div>Loading...</div>}>
                <BuyButton storeId={store.id} productId={product.id} size="lg" className="w-full md:w-auto" />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <Link href="/" className="hover:text-gray-900">
              Powered by Hatchy 🐣
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MINISTORE layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {store.heroImageUrl && (
            <div className="mb-8">
              <img src={store.heroImageUrl} alt="Hero" className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}
          <div className="text-center">
            {store.headline && <h1 className="text-4xl font-bold text-gray-900 mb-4">{store.headline}</h1>}
            {store.subheadline && <p className="text-xl text-gray-600">{store.subheadline}</p>}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {storeProductsData.map((product) => {
            const price = productPrices[product.id];
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                {product.defaultImageUrl ? (
                  <img
                    src={product.defaultImageUrl}
                    alt={product.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div>
                    <Badge className="mb-2">{product.productType}</Badge>
                    <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  {price && (
                    <div>
                      {price.compareAt ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-red-600">${(price.price / 100).toFixed(2)}</div>
                            <Badge variant="destructive" className="text-xs">Sale</Badge>
                          </div>
                          <div className="text-sm text-gray-500 line-through">${(price.compareAt / 100).toFixed(2)}</div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900">${(price.price / 100).toFixed(2)}</div>
                      )}
                    </div>
                  )}

                  <Suspense fallback={<div>Loading...</div>}>
                    <BuyButton storeId={store.id} productId={product.id} className="w-full" />
                  </Suspense>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <Link href="/" className="hover:text-gray-900">
            Powered by Hatchy 🐣
          </Link>
        </div>
      </div>
    </div>
  );
}
