'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, RotateCcw, Check, X, Eye, EyeOff } from 'lucide-react';
import { updateStorePrice, resetStorePrice, bulkUpdateVisibility, bulkAdjustPrices } from '@/app/actions/pricing';
import { useToast } from '@/components/ui/toast';
import { PriceEditModal } from './PriceEditModal';

type Product = {
  storeProduct: any;
  product: any;
  storePrice: any;
  defaultPrice: number;
};

type PriceTableProps = {
  storeId: string;
  products: Product[];
};

export function PriceTable({ storeId, products }: PriceTableProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'scheduled'>('all');
  const [scheduleModal, setScheduleModal] = useState<{ id: string; title: string; price: number } | null>(null);

  const filteredProducts = products.filter((p) => {
    if (!p.storePrice) return false;
    if (filter === 'all') return true;
    if (filter === 'visible') return p.storePrice.visibility === 'VISIBLE';
    if (filter === 'hidden') return p.storePrice.visibility === 'HIDDEN';
    if (filter === 'scheduled') return p.storePrice.visibility === 'SCHEDULED';
    return true;
  });

  // Check for zero prices
  const zeroPriceProducts = products.filter((p) => p.storePrice && p.storePrice.priceCents === 0);
  const hasZeroPrices = zeroPriceProducts.length > 0;

  const handleStartEdit = (priceId: string, currentPrice: number) => {
    setEditingId(priceId);
    setEditPrice((currentPrice / 100).toFixed(2));
  };

  const handleSavePrice = (priceId: string) => {
    startTransition(async () => {
      try {
        // Normalize: replace comma with dot, then parse
        const normalizedPrice = editPrice.replace(',', '.');
        const priceCents = Math.round(parseFloat(normalizedPrice) * 100);
        
        if (isNaN(priceCents) || priceCents <= 0) {
          showToast('Price must be greater than 0', 'error');
          return;
        }
        
        await updateStorePrice({
          storePriceId: priceId,
          priceCents,
        });
        showToast('Price updated successfully', 'success');
        setEditingId(null);
        router.refresh();
      } catch (error: any) {
        showToast(error.message || 'Failed to update price', 'error');
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const handleReset = (priceId: string) => {
    if (!confirm('Reset to default product price?')) return;

    startTransition(async () => {
      try {
        await resetStorePrice(priceId);
        showToast('Price reset to default', 'success');
        router.refresh();
      } catch (error: any) {
        showToast(error.message || 'Failed to reset price', 'error');
      }
    });
  };

  const handleVisibilityChange = (priceId: string, visibility: 'VISIBLE' | 'HIDDEN' | 'SCHEDULED') => {
    startTransition(async () => {
      try {
        await updateStorePrice({
          storePriceId: priceId,
          priceCents: 0, // Will be ignored, only visibility changes
          visibility,
        });
        showToast('Visibility updated', 'success');
        router.refresh();
      } catch (error: any) {
        showToast(error.message || 'Failed to update visibility', 'error');
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.storePrice.id));
    }
  };

  const handleBulkVisibility = (visibility: 'VISIBLE' | 'HIDDEN') => {
    if (selectedIds.length === 0) {
      showToast('No products selected', 'error');
      return;
    }

    startTransition(async () => {
      try {
        await bulkUpdateVisibility({
          storeId,
          storePriceIds: selectedIds,
          visibility,
        });
        showToast(`${selectedIds.length} products updated`, 'success');
        setSelectedIds([]);
        router.refresh();
      } catch (error: any) {
        showToast(error.message || 'Failed to update', 'error');
      }
    });
  };

  const handleBulkAdjust = (type: 'increase' | 'decrease') => {
    if (selectedIds.length === 0) {
      showToast('No products selected', 'error');
      return;
    }

    const percentage = prompt(`${type === 'increase' ? 'Increase' : 'Decrease'} prices by what percentage? (1-100)`);
    if (!percentage) return;

    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      showToast('Invalid percentage', 'error');
      return;
    }

    startTransition(async () => {
      try {
        await bulkAdjustPrices({
          storeId,
          storePriceIds: selectedIds,
          adjustmentType: type,
          percentage: pct,
        });
        showToast(`${selectedIds.length} prices adjusted`, 'success');
        setSelectedIds([]);
        router.refresh();
      } catch (error: any) {
        showToast(error.message || 'Failed to adjust prices', 'error');
      }
    });
  };

  return (
    <>
      {/* Zero Price Warning */}
      {hasZeroPrices && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Zero Prices Detected</h4>
              <p className="text-sm text-red-800 mb-2">
                {zeroPriceProducts.length} product{zeroPriceProducts.length > 1 ? 's have' : ' has'} a price of $0.00.
                Customers cannot purchase products with zero prices. Please set valid prices before publishing your store.
              </p>
              <p className="text-xs text-red-700">
                Click on any $0.00 price below to edit it. You can type prices with comma (1,99) or dot (1.99).
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6 space-y-4">
        {/* Filters and Bulk Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="all">All Products</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
              <Button variant="outline" size="sm" onClick={() => handleBulkVisibility('VISIBLE')}>
                <Eye className="w-4 h-4 mr-1" />
                Show
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkVisibility('HIDDEN')}>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAdjust('increase')}>
                +%
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAdjust('decrease')}>
                -%
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left p-4 font-medium text-sm text-gray-700">Product</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700">Default Price</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700">Store Price</th>
                <th className="text-left p-4 font-medium text-sm text-gray-700">Visibility</th>
                <th className="text-right p-4 font-medium text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item) => {
                const isEditing = editingId === item.storePrice.id;
                const hasOverride = item.storePrice.priceCents !== item.defaultPrice;
                const isOnSale = item.storePrice.compareAtCents && item.storePrice.compareAtCents > item.storePrice.priceCents;

                return (
                  <tr key={item.storePrice.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.storePrice.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.storePrice.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== item.storePrice.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.product.defaultImageUrl && (
                          <img
                            src={item.product.defaultImageUrl}
                            alt={item.product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{item.product.title}</div>
                          {isOnSale && (
                            <Badge variant="destructive" className="mt-1">
                              On Sale
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">${(item.defaultPrice / 100).toFixed(2)}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="0.00"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSavePrice(item.storePrice.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <Button size="sm" onClick={() => handleSavePrice(item.storePrice.id)} disabled={isPending}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item.storePrice.id, item.storePrice.priceCents)}
                          className={`font-medium hover:text-blue-600 ${item.storePrice.priceCents === 0 ? 'text-red-600' : ''}`}
                        >
                          ${(item.storePrice.priceCents / 100).toFixed(2)}
                          {hasOverride && <span className="text-blue-600 ml-1">*</span>}
                          {item.storePrice.priceCents === 0 && <span className="text-red-600 ml-1">⚠</span>}
                        </button>
                      )}
                      {isOnSale && (
                        <div className="text-xs text-gray-500 line-through mt-1">
                          ${(item.storePrice.compareAtCents / 100).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Select
                        value={item.storePrice.visibility}
                        onChange={(e) =>
                          handleVisibilityChange(item.storePrice.id, e.target.value as 'VISIBLE' | 'HIDDEN' | 'SCHEDULED')
                        }
                        className="w-32"
                      >
                        <option value="VISIBLE">Visible</option>
                        <option value="HIDDEN">Hidden</option>
                        <option value="SCHEDULED">Scheduled</option>
                      </Select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setScheduleModal({
                              id: item.storePrice.id,
                              title: item.product.title,
                              price: item.storePrice.priceCents,
                            })
                          }
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        {hasOverride && (
                          <Button variant="outline" size="sm" onClick={() => handleReset(item.storePrice.id)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-gray-500">
          * = Price override (different from default product price)
        </div>
      </Card>

      {/* Schedule Modal */}
      {scheduleModal && (
        <PriceEditModal
          storePriceId={scheduleModal.id}
          productTitle={scheduleModal.title}
          currentPrice={scheduleModal.price}
          onClose={() => setScheduleModal(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
