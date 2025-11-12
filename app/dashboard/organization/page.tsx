import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories, tags, brands, productCategories, productTags, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { OrganizationManager } from './OrganizationManager';

export default async function OrganizationPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch categories with product counts
  const userCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      productCount: sql<number>`count(distinct ${productCategories.productId})::int`,
    })
    .from(categories)
    .leftJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(categories.userId, session.user.id))
    .groupBy(categories.id, categories.name, categories.slug);

  // Fetch tags with product counts
  const userTags = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      productCount: sql<number>`count(distinct ${productTags.productId})::int`,
    })
    .from(tags)
    .leftJoin(productTags, eq(tags.id, productTags.tagId))
    .where(eq(tags.userId, session.user.id))
    .groupBy(tags.id, tags.name, tags.slug);

  // Fetch brands with product counts
  const userBrands = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      productCount: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(brands)
    .leftJoin(products, eq(brands.id, products.brandId))
    .where(eq(brands.userId, session.user.id))
    .groupBy(brands.id, brands.name, brands.slug);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Organization</h1>
        <p className="text-muted-foreground mt-2">
          Manage your categories, tags, and brands. Edit names, merge duplicates, and keep your catalog organized.
        </p>
      </div>

      <OrganizationManager
        initialCategories={userCategories}
        initialTags={userTags}
        initialBrands={userBrands}
      />
    </div>
  );
}
