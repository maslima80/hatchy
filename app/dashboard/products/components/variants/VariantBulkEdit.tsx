'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VariantBulkEditProps {
  productId: string;
  variantIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type UpdateMode = 'set' | 'add' | 'subtract';

export function VariantBulkEdit({
  productId,
  variantIds,
  open,
  onOpenChange,
  onSuccess,
}: VariantBulkEditProps) {
  const [priceMode, setPriceMode] = useState<UpdateMode>('set');
  const [priceValue, setPriceValue] = useState('');
  const [costMode, setCostMode] = useState<UpdateMode>('set');
  const [costValue, setCostValue] = useState('');
  const [stockMode, setStockMode] = useState<UpdateMode>('set');
  const [stockValue, setStockValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const updates: any = {};

      // Price update
      if (priceValue) {
        const value = parseFloat(priceValue);
        if (!isNaN(value)) {
          const cents = Math.round(value * 100);
          if (priceMode === 'set') {
            updates.priceCents = cents;
          }
          // For add/subtract, we'd need to fetch current values first
          // Keeping it simple for MVP - only support "set"
        }
      }

      // Cost update
      if (costValue) {
        const value = parseFloat(costValue);
        if (!isNaN(value)) {
          const cents = Math.round(value * 100);
          if (costMode === 'set') {
            updates.costCents = cents;
          }
        }
      }

      // Stock update
      if (stockValue) {
        const value = parseInt(stockValue);
        if (!isNaN(value)) {
          if (stockMode === 'set') {
            updates.stock = value;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        alert('Please enter at least one value to update');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/products/${productId}/variants/bulk-update`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantIds,
            updates,
          }),
        }
      );

      if (response.ok) {
        // Reset form
        setPriceValue('');
        setCostValue('');
        setStockValue('');
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update variants');
      }
    } catch (error) {
      console.error('Error bulk updating variants:', error);
      alert('Failed to update variants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Variants</DialogTitle>
          <DialogDescription>
            Update {variantIds.length} variant{variantIds.length !== 1 ? 's' : ''} at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price */}
          <div className="space-y-2">
            <Label>Price</Label>
            <div className="flex gap-2">
              <Select
                value={priceMode}
                onValueChange={(value) => setPriceMode(value as UpdateMode)}
                disabled={loading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to</SelectItem>
                  <SelectItem value="add" disabled>Add (soon)</SelectItem>
                  <SelectItem value="subtract" disabled>Subtract (soon)</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  disabled={loading}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label>Cost</Label>
            <div className="flex gap-2">
              <Select
                value={costMode}
                onValueChange={(value) => setCostMode(value as UpdateMode)}
                disabled={loading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to</SelectItem>
                  <SelectItem value="add" disabled>Add (soon)</SelectItem>
                  <SelectItem value="subtract" disabled>Subtract (soon)</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costValue}
                  onChange={(e) => setCostValue(e.target.value)}
                  disabled={loading}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label>Stock</Label>
            <div className="flex gap-2">
              <Select
                value={stockMode}
                onValueChange={(value) => setStockMode(value as UpdateMode)}
                disabled={loading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to</SelectItem>
                  <SelectItem value="add" disabled>Add (soon)</SelectItem>
                  <SelectItem value="subtract" disabled>Subtract (soon)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
