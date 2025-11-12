import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getProductById } from '@/lib/products';
import { getUserCategories } from '@/lib/categories';
import { getUserTags } from '@/lib/tags';
import { getUserBrands } from '@/lib/brands';
import { ProductManagerV3 } from '../components/ProductManagerV3';
import { redirect } from 'next/navigation';

export default async function EditProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch product with all relations
  const product = await getProductById(id, session.user.id);

  if (!product) {
    redirect('/dashboard/products');
  }

  // Fetch user's categories, tags, and brands for selection
  const userCategories = await getUserCategories(session.user.id);
  const userTags = await getUserTags(session.user.id);
  const userBrands = await getUserBrands(session.user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111]">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product details, variants, and publishing settings</p>
      </div>

      <ProductManagerV3 
        product={product}
        userCategories={userCategories}
        userTags={userTags}
        userBrands={userBrands}
      />
    </div>
  );
}
