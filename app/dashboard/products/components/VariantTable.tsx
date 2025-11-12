'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

type Variant = {
  id?: string;
  sku?: string;
  optionsJson?: string;
  costCents: number;
  priceCents: number;
};

type VariantTableProps = {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
};

export function VariantTable({ variants, onChange }: VariantTableProps) {
  const [editingCost, setEditingCost] = useState<{ [key: number]: string }>({});
  const [editingPrice, setEditingPrice] = useState<{ [key: number]: string }>({});
  const addVariant = () => {
    onChange([
      ...variants,
      {
        sku: '',
        optionsJson: '',
        costCents: 0,
        priceCents: 0,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleCostChange = (index: number, value: string) => {
    // Store the raw input value
    setEditingCost({ ...editingCost, [index]: value });
  };

  const handleCostBlur = (index: number) => {
    const value = editingCost[index] || '';
    const normalizedValue = value.replace(',', '.');
    const cents = Math.round(parseFloat(normalizedValue || '0') * 100);
    updateVariant(index, 'costCents', isNaN(cents) ? 0 : cents);
    // Clear editing state
    const newEditing = { ...editingCost };
    delete newEditing[index];
    setEditingCost(newEditing);
  };

  const handlePriceChange = (index: number, value: string) => {
    // Store the raw input value
    setEditingPrice({ ...editingPrice, [index]: value });
  };

  const handlePriceBlur = (index: number) => {
    const value = editingPrice[index] || '';
    const normalizedValue = value.replace(',', '.');
    const cents = Math.round(parseFloat(normalizedValue || '0') * 100);
    updateVariant(index, 'priceCents', isNaN(cents) ? 0 : cents);
    // Clear editing state
    const newEditing = { ...editingPrice };
    delete newEditing[index];
    setEditingPrice(newEditing);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Variants</h3>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No variants yet. Add at least one.</p>
          <Button type="button" variant="outline" onClick={addVariant}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Variant
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Options (JSON)</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Cost ($)</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Price ($)</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="p-2">
                    <Input
                      value={variant.sku || ''}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      placeholder="SKU-001"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={variant.optionsJson || ''}
                      onChange={(e) => updateVariant(index, 'optionsJson', e.target.value)}
                      placeholder='{"size":"M","color":"Blue"}'
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={editingCost[index] !== undefined ? editingCost[index] : (variant.costCents / 100).toFixed(2)}
                      onChange={(e) => handleCostChange(index, e.target.value)}
                      onBlur={() => handleCostBlur(index)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={editingPrice[index] !== undefined ? editingPrice[index] : (variant.priceCents / 100).toFixed(2)}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      onBlur={() => handlePriceBlur(index)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
