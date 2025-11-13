import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeProducts, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { StoreForm } from '../components/StoreForm';
import { ToastProvider } from '@/components/ui/toast';

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  // Fetch store
  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, id), eq(stores.userId, session!.user.id)))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Fetch store products
  const storeProductsList = await db
    .select()
    .from(storeProducts)
    .where(eq(storeProducts.storeId, id));

  const storeProductIds = storeProductsList.map((sp) => sp.productId);

  // Fetch READY products for this user
  const readyProductsRaw = await db
    .select()
    .from(products)
    .where(and(eq(products.userId, session!.user.id), eq(products.status, 'READY')));

  // Map to expected format (productType instead of type)
  const readyProducts = readyProductsRaw.map(p => ({
    id: p.id,
    title: p.title,
    productType: p.type as 'POD' | 'DROPSHIP' | 'OWN',
    defaultImageUrl: p.defaultImageUrl,
  }));

  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Edit Store</h1>
          <p className="text-gray-600 mt-1">Update store details and products</p>
        </div>

        <StoreForm store={store} storeProductIds={storeProductIds} availableProducts={readyProducts} />
      </div>
    </ToastProvider>
  );
}
