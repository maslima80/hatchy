'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatOptionValues } from '@/lib/variants-client';

interface Variant {
  id: string;
  sku: string | null;
  optionValuesJson: string | null;
  priceCents: number | null;
  costCents: number | null;
  stock: number | null;
  imageUrl: string | null;
}

interface VariantTableProps {
  productId: string;
  variants: Variant[];
  onVariantsChange: () => void;
  onBulkEdit: (variantIds: string[]) => void;
}

export function VariantTable({
  productId,
  variants,
  onVariantsChange,
  onBulkEdit,
}: VariantTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variants.map(v => v.id)));
    }
  };

  const startEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    setSaving(true);

    try {
      const updateData: any = {};
      
      if (field === 'sku') {
        updateData.sku = editValue.trim() || null;
      } else if (field === 'priceCents') {
        const value = parseFloat(editValue);
        updateData.priceCents = isNaN(value) ? null : Math.round(value * 100);
      } else if (field === 'costCents') {
        const value = parseFloat(editValue);
        updateData.costCents = isNaN(value) ? null : Math.round(value * 100);
      } else if (field === 'stock') {
        const value = parseInt(editValue);
        updateData.stock = isNaN(value) ? null : value;
      }

      const response = await fetch(`/api/variants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setEditingCell(null);
        setEditValue('');
        onVariantsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update variant');
      }
    } catch (error) {
      console.error('Error updating variant:', error);
      alert('Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onVariantsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete variant');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Failed to delete variant');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number | null) => {
    if (cents === null) return '—';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const parseOptionValues = (json: string | null) => {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border rounded-lg">
        <p className="text-lg font-medium">No variants yet</p>
        <p className="text-sm mt-2">
          Add option groups and click "Generate Variants" to create combinations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} variant{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            onClick={() => onBulkEdit(Array.from(selectedIds))}
            disabled={saving}
          >
            Bulk Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedIds(new Set())}
            disabled={saving}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-left">
                <Checkbox
                  checked={selectedIds.size === variants.length}
                  onCheckedChange={toggleSelectAll}
                  disabled={saving}
                />
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                Options
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                SKU
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                Price
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                Cost
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                Stock
              </th>
              <th className="p-3 text-left text-sm font-medium text-gray-700">
                Image
              </th>
              <th className="p-3 text-right text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const options = parseOptionValues(variant.optionValuesJson);
              const isEditing = (field: string) =>
                editingCell?.id === variant.id && editingCell?.field === field;

              return (
                <tr key={variant.id} className="border-b hover:bg-gray-50">
                  {/* Select */}
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.has(variant.id)}
                      onCheckedChange={() => toggleSelect(variant.id)}
                      disabled={saving}
                    />
                  </td>

                  {/* Options (read-only) */}
                  <td className="p-3">
                    <span className="text-sm text-gray-700">
                      {formatOptionValues(options)}
                    </span>
                  </td>

                  {/* SKU (editable) */}
                  <td className="p-3">
                    {isEditing('sku') ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        disabled={saving}
                        className="w-32"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(variant.id, 'sku', variant.sku)}
                        className="text-sm text-gray-700 hover:text-blue-600 flex items-center gap-1"
                        disabled={saving}
                      >
                        {variant.sku || <span className="text-gray-400">—</span>}
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    )}
                  </td>

                  {/* Price (editable) */}
                  <td className="p-3">
                    {isEditing('priceCents') ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        disabled={saving}
                        className="w-24"
                      />
                    ) : (
                      <button
                        onClick={() =>
                          startEdit(
                            variant.id,
                            'priceCents',
                            variant.priceCents ? variant.priceCents / 100 : ''
                          )
                        }
                        className="text-sm text-gray-700 hover:text-blue-600"
                        disabled={saving}
                      >
                        {formatPrice(variant.priceCents)}
                      </button>
                    )}
                  </td>

                  {/* Cost (editable) */}
                  <td className="p-3">
                    {isEditing('costCents') ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        disabled={saving}
                        className="w-24"
                      />
                    ) : (
                      <button
                        onClick={() =>
                          startEdit(
                            variant.id,
                            'costCents',
                            variant.costCents ? variant.costCents / 100 : ''
                          )
                        }
                        className="text-sm text-gray-700 hover:text-blue-600"
                        disabled={saving}
                      >
                        {formatPrice(variant.costCents)}
                      </button>
                    )}
                  </td>

                  {/* Stock (editable) */}
                  <td className="p-3">
                    {isEditing('stock') ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        onBlur={saveEdit}
                        autoFocus
                        disabled={saving}
                        className="w-20"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(variant.id, 'stock', variant.stock)}
                        className="text-sm text-gray-700 hover:text-blue-600"
                        disabled={saving}
                      >
                        {variant.stock ?? '—'}
                      </button>
                    )}
                  </td>

                  {/* Image */}
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      title="Image picker coming soon"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(variant.id)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
