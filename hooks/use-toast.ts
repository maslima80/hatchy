// Simple toast hook - you can replace with a proper toast library later
import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Toast) => {
    // For now, just use alert - you can integrate a proper toast library later
    if (toast.variant === 'destructive') {
      alert(`❌ ${toast.title}\n${toast.description || ''}`);
    } else {
      alert(`✅ ${toast.title}\n${toast.description || ''}`);
    }
  }, []);

  return { toast, toasts };
}
