'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import type { ProductWithRelations } from '@/lib/products';

interface ProductVariantsTabProps {
  product: ProductWithRelations;
}

export function ProductVariantsTab({ product }: ProductVariantsTabProps) {
  const router = useRouter();
  const [variants, setVariants] = useState(product.variants || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    sku: '',
    optionsJson: '',
    costCents: 0,
    priceCents: 0,
  });

  const startEdit = (variant: any) => {
    setEditingId(variant.id);
    setEditForm({
      sku: variant.sku || '',
      optionsJson: variant.optionsJson || '',
      costCents: variant.costCents || 0,
      priceCents: variant.priceCents || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ sku: '', optionsJson: '', costCents: 0, priceCents: 0 });
  };

  const saveVariant = async (variantId: string) => {
    try {
      const response = await fetch(`/api/products/${product.id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to save');

      router.refresh();
      setEditingId(null);
      alert('Variant updated!');
    } catch (error) {
      alert('Failed to save variant');
    }
  };

  const deleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return;

    try {
      const response = await fetch(`/api/products/${product.id}/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.refresh();
      alert('Variant deleted!');
    } catch (error) {
      alert('Failed to delete variant');
    }
  };

  const addVariant = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: `VAR-${Date.now()}`,
          optionsJson: '{}',
          costCents: 0,
          priceCents: 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      router.refresh();
      alert('Variant created!');
    } catch (error) {
      alert('Failed to create variant');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-gray-600">Manage different options and pricing</p>
        </div>
        <Button onClick={addVariant} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No variants yet</p>
          <Button onClick={addVariant} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create First Variant
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Options</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Cost</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Price</th>
                <th className="text-right p-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b hover:bg-gray-50">
                  {editingId === variant.id ? (
                    <>
                      <td className="p-3">
                        <Input
                          value={editForm.sku}
                          onChange={(e) =>
                            setEditForm({ ...editForm, sku: e.target.value })
                          }
                          placeholder="SKU"
                          className="h-8"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={editForm.optionsJson}
                          onChange={(e) =>
                            setEditForm({ ...editForm, optionsJson: e.target.value })
                          }
                          placeholder='{"size":"M"}'
                          className="h-8"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={editForm.costCents}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              costCents: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="h-8 text-right"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={editForm.priceCents}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              priceCents: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="h-8 text-right"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => saveVariant(variant.id)}
                            size="sm"
                            variant="default"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button onClick={cancelEdit} size="sm" variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {variant.sku || 'N/A'}
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="text-xs text-gray-600">
                          {variant.optionsJson || '{}'}
                        </code>
                      </td>
                      <td className="p-3 text-right text-sm">
                        {variant.costCents ? `$${(variant.costCents / 100).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {variant.priceCents ? `$${(variant.priceCents / 100).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => startEdit(variant)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => deleteVariant(variant.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Media Gallery Placeholder */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Media Gallery</h3>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
          <p>Media gallery coming soon</p>
          <p className="text-sm mt-2">Upload images and videos for this product</p>
        </div>
      </div>
    </div>
  );
}
