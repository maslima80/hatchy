import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeProducts } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Plus, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { StoreActions } from './components/StoreActions';

export default async function StoresPage() {
  const session = await getSession();

  // Fetch stores for this user
  const userStores = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, session!.user.id))
    .orderBy(desc(stores.updatedAt));

  // Get product counts for each store
  const storeCounts: Record<string, number> = {};
  for (const store of userStores) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(storeProducts)
      .where(eq(storeProducts.storeId, store.id));
    storeCounts[store.id] = Number(result?.count || 0);
  }

  const hasStores = userStores.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Stores</h1>
          <p className="text-gray-600 mt-1">Manage your micro-stores and pages</p>
        </div>
        <Link href="/dashboard/stores/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Store
          </Button>
        </Link>
      </div>

      {!hasStores ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No stores yet</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Create your first store to showcase your products. Choose from Hotsite, Mini-Store, or Link-in-Bio templates.
            </p>
            <Link href="/dashboard/stores/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Store Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{store.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">/{store.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={store.type === 'HOTSITE' ? 'default' : 'secondary'}>
                      {store.type === 'HOTSITE' ? 'Hotsite' : 'Mini-Store'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={store.status === 'LIVE' ? 'default' : 'outline'}>
                    {store.status === 'LIVE' ? '🟢 Live' : '⚪ Draft'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-medium">{storeCounts[store.id] || 0}</span>
                </div>

                <div className="text-sm text-gray-500">
                  Updated {new Date(store.updatedAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/s/${store.slug}`} target="_blank" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/stores/${store.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <StoreActions storeId={store.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
