'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type BuyButtonProps = {
  storeId: string;
  productId: string;
  quantity?: number;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
};

export function BuyButton({ storeId, productId, quantity = 1, size = 'lg', className, children }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Show success/cancel messages
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      // Could show a toast here
      console.log('Payment successful!');
    }
    if (searchParams.get('canceled') === '1') {
      console.log('Payment canceled');
    }
  }, [searchParams]);

  const handleBuy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, productId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error messages
        let errorMessage = data.error || 'Failed to create checkout session';
        
        if (errorMessage.includes('price not configured') || errorMessage.includes('price ≤ 0')) {
          errorMessage = 'This product is not available for purchase at this time. Please contact the seller.';
        } else if (errorMessage.includes('payouts not configured') || errorMessage.includes('cannot accept payments')) {
          errorMessage = 'The seller has not set up payments yet. Please contact them directly.';
        } else if (errorMessage.includes('not available')) {
          errorMessage = 'This product is currently unavailable.';
        }
        
        throw new Error(errorMessage);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleBuy} disabled={isLoading} size={size} className={className}>
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            {children || 'Buy Now'}
          </>
        )}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
