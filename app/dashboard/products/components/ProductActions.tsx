'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { duplicateProduct, deleteProduct } from '@/app/actions/products';

type ProductActionsProps = {
  productId: string;
};

export function ProductActions({ productId }: ProductActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        const result = await duplicateProduct(productId);
        router.refresh();
      } catch (error: any) {
        alert(error.message || 'Failed to duplicate product');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    startTransition(async () => {
      try {
        await deleteProduct(productId);
        router.refresh();
      } catch (error: any) {
        alert(error.message || 'Failed to delete product');
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicate}
        disabled={isPending}
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </Button>
    </>
  );
}
