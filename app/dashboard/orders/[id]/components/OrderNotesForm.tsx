'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateOrderNotes } from '@/app/actions/orders';

type OrderNotesFormProps = {
  orderId: string;
  initialNotes: string;
};

export function OrderNotesForm({ orderId, initialNotes }: OrderNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateOrderNotes(orderId, notes);
        setMessage({ type: 'success', text: 'Notes saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Failed to save notes' });
      }
    });
  };

  const hasChanges = notes !== initialNotes;

  return (
    <div className="space-y-4">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this order (e.g., shipping details, customer requests, fulfillment status...)"
        rows={6}
        className="resize-none"
      />

      {message && (
        <div
          className={`text-sm p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
        </p>
        <Button onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>
    </div>
  );
}
