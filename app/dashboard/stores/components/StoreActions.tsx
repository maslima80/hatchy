'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteStore } from '@/app/actions/stores';

type StoreActionsProps = {
  storeId: string;
};

export function StoreActions({ storeId }: StoreActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;

    startTransition(async () => {
      try {
        await deleteStore(storeId);
        router.refresh();
      } catch (error: any) {
        alert(error.message || 'Failed to delete store');
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="w-4 h-4 text-red-600" />
    </Button>
  );
}
