import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productSources, productVariants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ProductForm } from '../components/ProductForm';
import { ToastProvider } from '@/components/ui/toast';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  
  // Fetch product
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, params.id), eq(products.userId, session!.user.id)))
    .limit(1);

  if (!product) {
    notFound();
  }

  // Fetch source
  const [source] = await db
    .select()
    .from(productSources)
    .where(eq(productSources.productId, params.id))
    .limit(1);

  // Fetch variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, params.id));

  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product details</p>
        </div>

        <ProductForm product={product} source={source} variants={variants} />
      </div>
    </ToastProvider>
  );
}
