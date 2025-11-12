'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, GripVertical } from 'lucide-react';

type Product = {
  id: string;
  title: string;
  productType: 'POD' | 'DROPSHIP' | 'OWN';
  defaultImageUrl?: string | null;
};

type StoreProductPickerProps = {
  products: Product[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  storeType: 'HOTSITE' | 'MINISTORE';
};

export function StoreProductPicker({ products, selectedIds, onChange, storeType }: StoreProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (productId: string) => {
    if (storeType === 'HOTSITE') {
      // Radio behavior - only one selection
      onChange([productId]);
    } else {
      // Checkbox behavior - multiple selections
      if (selectedIds.includes(productId)) {
        onChange(selectedIds.filter((id) => id !== productId));
      } else {
        onChange([...selectedIds, productId]);
      }
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedIds];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newOrder = [...selectedIds];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(newOrder);
  };

  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        <Label>
          {storeType === 'HOTSITE' ? 'Select One Product' : 'Select Products'} ({selectedIds.length} selected)
        </Label>
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No products found' : 'No READY products available'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type={storeType === 'HOTSITE' ? 'radio' : 'checkbox'}
                      checked={isSelected}
                      onChange={() => handleToggle(product.id)}
                      className="w-4 h-4"
                    />
                    {product.defaultImageUrl && (
                      <img
                        src={product.defaultImageUrl}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{product.title}</div>
                      <Badge variant="outline" className="mt-1">
                        {product.productType}
                      </Badge>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Products (with reordering for MINISTORE) */}
      {storeType === 'MINISTORE' && selectedProducts.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Products Order</Label>
          <div className="border rounded-lg divide-y">
            {selectedProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 p-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === selectedProducts.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <GripVertical className="w-4 h-4 text-gray-400" />
                {product.defaultImageUrl && (
                  <img
                    src={product.defaultImageUrl}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{product.title}</div>
                </div>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
