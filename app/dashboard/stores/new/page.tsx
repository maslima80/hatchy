import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { StoreForm } from '../components/StoreForm';
import { ToastProvider } from '@/components/ui/toast';

export default async function NewStorePage() {
  const session = await getSession();

  // Fetch READY products for this user
  const readyProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.userId, session!.user.id), eq(products.status, 'READY')));

  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Create Store</h1>
          <p className="text-gray-600 mt-1">Launch a new micro-store or hotsite</p>
        </div>

        {readyProducts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">No products available</h3>
            <p className="text-yellow-800 text-sm">
              You need at least one product with "Ready" status to create a store. Go to Products and set a product to
              Ready first.
            </p>
          </div>
        ) : (
          <StoreForm availableProducts={readyProducts} />
        )}
      </div>
    </ToastProvider>
  );
}
