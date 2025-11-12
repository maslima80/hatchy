'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, DollarSign, Eye, EyeOff } from 'lucide-react';
import type { ProductWithRelations } from '@/lib/products';

interface ProductPublishingTabProps {
  product: ProductWithRelations;
}

export function ProductPublishingTab({ product }: ProductPublishingTabProps) {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [storePrices, setStorePrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user's stores
      const storesRes = await fetch('/api/stores');
      const storesData = await storesRes.json();
      setStores(storesData);

      // Fetch store products for this product
      const spRes = await fetch(`/api/products/${product.id}/store-products`);
      const spData = await spRes.json();
      setStoreProducts(spData);

      // Fetch store prices
      const pricesRes = await fetch(`/api/products/${product.id}/store-prices`);
      const pricesData = await pricesRes.json();
      
      const pricesMap: Record<string, string> = {};
      pricesData.forEach((price: any) => {
        pricesMap[price.storeId] = (price.priceCents / 100).toFixed(2);
      });
      setStorePrices(pricesMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attachToStore = async (storeId: string) => {
    try {
      const response = await fetch(`/api/products/${product.id}/attach-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      if (!response.ok) throw new Error('Failed to attach');

      await fetchData();
      router.refresh();
      alert('Product attached to store!');
    } catch (error) {
      alert('Failed to attach to store');
    }
  };

  const detachFromStore = async (storeId: string) => {
    if (!confirm('Remove product from this store?')) return;

    try {
      const response = await fetch(`/api/products/${product.id}/detach-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });

      if (!response.ok) throw new Error('Failed to detach');

      await fetchData();
      router.refresh();
      alert('Product removed from store!');
    } catch (error) {
      alert('Failed to remove from store');
    }
  };

  const updatePrice = async (storeId: string) => {
    const priceStr = storePrices[storeId];
    if (!priceStr) return;

    const priceCents = Math.round(parseFloat(priceStr) * 100);

    try {
      const response = await fetch(`/api/products/${product.id}/set-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          priceCents,
          currency: 'USD',
        }),
      });

      if (!response.ok) throw new Error('Failed to set price');

      await fetchData();
      router.refresh();
      alert('Price updated!');
    } catch (error) {
      alert('Failed to update price');
    }
  };

  const toggleVisibility = async (storeId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';

    // Check if price > 0 before allowing VISIBLE
    if (newVisibility === 'VISIBLE') {
      const priceStr = storePrices[storeId];
      const priceCents = priceStr ? Math.round(parseFloat(priceStr) * 100) : 0;
      
      if (priceCents <= 0) {
        alert('Cannot set product to VISIBLE without a price > 0');
        return;
      }
    }

    try {
      const response = await fetch(`/api/products/${product.id}/set-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          visibility: newVisibility,
        }),
      });

      if (!response.ok) throw new Error('Failed to update visibility');

      await fetchData();
      router.refresh();
    } catch (error) {
      alert('Failed to update visibility');
    }
  };

  const isAttached = (storeId: string) => {
    return storeProducts.some((sp) => sp.storeId === storeId);
  };

  const getStoreProduct = (storeId: string) => {
    return storeProducts.find((sp) => sp.storeId === storeId);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Publish to Stores</h3>
        <p className="text-sm text-gray-600">
          Attach this product to your stores and set per-store pricing
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No stores yet</p>
          <Button onClick={() => router.push('/dashboard/stores/new')} variant="outline">
            Create Your First Store
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => {
            const attached = isAttached(store.id);
            const storeProduct = getStoreProduct(store.id);

            return (
              <div
                key={store.id}
                className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{store.name}</h4>
                    <p className="text-sm text-gray-600">/{store.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {attached && storeProduct && (
                      <Badge
                        variant={
                          storeProduct.visibility === 'VISIBLE' ? 'default' : 'outline'
                        }
                      >
                        {storeProduct.visibility}
                      </Badge>
                    )}
                    {attached ? (
                      <Button
                        onClick={() => detachFromStore(store.id)}
                        size="sm"
                        variant="outline"
                      >
                        Detach
                      </Button>
                    ) : (
                      <Button
                        onClick={() => attachToStore(store.id)}
                        size="sm"
                        variant="default"
                      >
                        Attach
                      </Button>
                    )}
                  </div>
                </div>

                {attached && (
                  <div className="space-y-3 pt-3 border-t">
                    {/* Price Input */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`price-${store.id}`}>Price (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id={`price-${store.id}`}
                            type="text"
                            value={storePrices[store.id] || ''}
                            onChange={(e) =>
                              setStorePrices({
                                ...storePrices,
                                [store.id]: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Button onClick={() => updatePrice(store.id)} size="sm">
                        Update Price
                      </Button>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Visibility</span>
                      <Button
                        onClick={() =>
                          toggleVisibility(store.id, storeProduct?.visibility || 'HIDDEN')
                        }
                        size="sm"
                        variant="outline"
                      >
                        {storeProduct?.visibility === 'VISIBLE' ? (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </div>

                    {storeProduct?.visibility === 'HIDDEN' && (
                      <p className="text-xs text-amber-600">
                        ⚠️ Product is hidden. Set a price {'>'} 0 and toggle visibility to
                        publish.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
