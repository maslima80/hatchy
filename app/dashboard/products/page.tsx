import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, variants, productCategories, productTags, categories, tags } from '@/lib/db/schema';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Plus, Edit } from 'lucide-react';
import { ProductActions } from './components/ProductActions';
import { ProductFilters } from './components/ProductFilters';

type SearchParams = {
  status?: 'DRAFT' | 'READY';
  type?: 'OWN' | 'POD' | 'DIGITAL';
  search?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  
  // Build query conditions
  const conditions = [
    eq(products.userId, session!.user.id),
    isNull(products.deletedAt),
  ];

  if (searchParams.status) {
    conditions.push(eq(products.status, searchParams.status));
  }

  if (searchParams.type) {
    conditions.push(eq(products.type, searchParams.type));
  }

  // Fetch products for this user
  let userProducts = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt));

  // Apply search filter
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    userProducts = userProducts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
    );
  }

  // Get variant counts for each product
  const productIds = userProducts.map((p) => p.id);
  const variantCounts: Record<string, number> = {};

  if (productIds.length > 0) {
    const allVariants = await db
      .select()
      .from(variants)
      .where(
        and(
          inArray(variants.productId, productIds),
          isNull(variants.deletedAt)
        )
      );

    for (const variant of allVariants) {
      variantCounts[variant.productId] = (variantCounts[variant.productId] || 0) + 1;
    }
  }

  // Get categories and tags for each product
  const productCategoriesMap: Record<string, string[]> = {};
  const productTagsMap: Record<string, string[]> = {};

  if (productIds.length > 0) {
    // Get all product-category relationships
    const prodCats = await db
      .select()
      .from(productCategories)
      .where(inArray(productCategories.productId, productIds));

    const categoryIds = [...new Set(prodCats.map((pc) => pc.categoryId))];
    const allCategories =
      categoryIds.length > 0
        ? await db.select().from(categories).where(inArray(categories.id, categoryIds))
        : [];

    const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));

    for (const pc of prodCats) {
      if (!productCategoriesMap[pc.productId]) {
        productCategoriesMap[pc.productId] = [];
      }
      productCategoriesMap[pc.productId].push(categoryMap[pc.categoryId] || '');
    }

    // Get all product-tag relationships
    const prodTags = await db
      .select()
      .from(productTags)
      .where(inArray(productTags.productId, productIds));

    const tagIds = [...new Set(prodTags.map((pt) => pt.tagId))];
    const allTags =
      tagIds.length > 0
        ? await db.select().from(tags).where(inArray(tags.id, tagIds))
        : [];

    const tagMap = Object.fromEntries(allTags.map((t) => [t.id, t.name]));

    for (const pt of prodTags) {
      if (!productTagsMap[pt.productId]) {
        productTagsMap[pt.productId] = [];
      }
      productTagsMap[pt.productId].push(tagMap[pt.tagId] || '');
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

      {/* Filters */}
      <ProductFilters />

      {!hasProducts ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Start by adding your first product. You can add your own products, POD items, or digital goods.
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
                  <th className="text-left p-4 font-medium text-sm text-gray-700">Categories/Tags</th>
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
                          product.type === 'POD'
                            ? 'default'
                            : product.type === 'DIGITAL'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {product.type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={product.status === 'READY' ? 'default' : 'outline'}>
                        {product.status === 'READY' ? '✅ Ready' : '📝 Draft'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {(variantCounts[product.id] || 0) <= 1 ? (
                        <Badge variant="outline" className="text-xs">
                          Simple
                        </Badge>
                      ) : (
                        <span className="text-gray-600">
                          {variantCounts[product.id]} variants
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {productCategoriesMap[product.id]?.map((cat, i) => (
                          <Badge key={`cat-${i}`} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {productTagsMap[product.id]?.map((tag, i) => (
                          <Badge key={`tag-${i}`} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
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
