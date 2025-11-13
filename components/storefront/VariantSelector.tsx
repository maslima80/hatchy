'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatOptionValues } from '@/lib/variants-client';

interface ProductOption {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Variant {
  id: string;
  sku: string | null;
  optionValuesJson: string | null;
  priceCents: number | null;
  stock: number | null;
  imageUrl: string | null;
}

interface VariantSelectorProps {
  productId: string;
  options: ProductOption[];
  variants: Variant[];
  defaultPrice: number; // Fallback price in cents
  onVariantChange?: (variantId: string | null, price: number) => void;
}

export function VariantSelector({
  productId,
  options,
  variants,
  defaultPrice,
  onVariantChange,
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Check if all options are selected
  useEffect(() => {
    const allSelected = options.every((opt) => selectedOptions[opt.name]);
    setIsValid(allSelected);

    if (allSelected) {
      // Find matching variant
      const match = variants.find((v) => {
        if (!v.optionValuesJson) return false;
        try {
          const variantOptions = JSON.parse(v.optionValuesJson);
          return options.every((opt) => variantOptions[opt.name] === selectedOptions[opt.name]);
        } catch {
          return false;
        }
      });

      setSelectedVariant(match || null);
      
      // Notify parent
      if (match) {
        const price = match.priceCents || defaultPrice;
        onVariantChange?.(match.id, price);
      } else {
        onVariantChange?.(null, defaultPrice);
      }
    } else {
      setSelectedVariant(null);
      onVariantChange?.(null, defaultPrice);
    }
  }, [selectedOptions, options, variants, defaultPrice, onVariantChange]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  // If no options, this is a simple product
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id} className="space-y-2">
          <Label className="text-sm font-medium">
            {option.name}
            {selectedOptions[option.name] && (
              <span className="ml-2 text-muted-foreground">
                {selectedOptions[option.name]}
              </span>
            )}
          </Label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((val) => {
              const isSelected = selectedOptions[option.name] === val.value;
              return (
                <Button
                  key={val.id}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleOptionSelect(option.name, val.value)}
                  className="min-w-[60px]"
                >
                  {val.value}
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Validation feedback */}
      {!isValid && (
        <p className="text-sm text-muted-foreground">
          Please select all options to continue
        </p>
      )}

      {/* Selected variant info */}
      {isValid && selectedVariant && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">
            {formatOptionValues(selectedOptions)}
          </Badge>
          {selectedVariant.stock !== null && selectedVariant.stock <= 0 && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
          {selectedVariant.stock !== null && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
            <Badge variant="outline" className="text-orange-600">
              Only {selectedVariant.stock} left
            </Badge>
          )}
        </div>
      )}

      {/* No matching variant */}
      {isValid && !selectedVariant && (
        <Badge variant="destructive">
          This combination is not available
        </Badge>
      )}
    </div>
  );
}
