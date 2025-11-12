'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { scheduleSale } from '@/app/actions/pricing';
import { useToast } from '@/components/ui/toast';

type PriceEditModalProps = {
  storePriceId: string;
  productTitle: string;
  currentPrice: number;
  onClose: () => void;
  onSuccess: () => void;
};

export function PriceEditModal({
  storePriceId,
  productTitle,
  currentPrice,
  onClose,
  onSuccess,
}: PriceEditModalProps) {
  const { showToast } = useToast();
  const [salePrice, setSalePrice] = useState((currentPrice / 100).toFixed(2));
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startAt = new Date(`${startDate}T${startTime}`);
      const endAt = new Date(`${endDate}T${endTime}`);

      await scheduleSale({
        storePriceId,
        priceCents: Math.round(parseFloat(salePrice) * 100),
        compareAtCents: Math.round(parseFloat(compareAtPrice) * 100),
        startAt,
        endAt,
      });

      showToast('Sale scheduled successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to schedule sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule Sale</CardTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{productTitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Original Price *</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder={(currentPrice / 100).toFixed(2)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date & Time *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Scheduling...' : 'Schedule Sale'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
