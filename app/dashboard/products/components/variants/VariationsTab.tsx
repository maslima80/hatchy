'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { OptionGroupsEditor } from './OptionGroupsEditor';
import { VariantTable } from './VariantTable';
import { VariantBulkEdit } from './VariantBulkEdit';

interface VariationsTabProps {
  productId: string;
  variationsEnabled: boolean;
  onVariationsEnabledChange: (enabled: boolean) => void;
}

export function VariationsTab({
  productId,
  variationsEnabled,
  onVariationsEnabledChange,
}: VariationsTabProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  useEffect(() => {
    if (variationsEnabled) {
      fetchOptions();
      fetchVariants();
    }
  }, [variationsEnabled, productId]);

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/options`);
      if (response.ok) {
        const data = await response.json();
        setOptions(data.options || []);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/variants`);
      
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
      } else {
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
    }
  };

  const handleGenerateVariants = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/products/${productId}/variants/generate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
        alert(data.message || 'Variants generated successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate variants');
      }
    } catch (error) {
      console.error('Error generating variants:', error);
      alert('Failed to generate variants');
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkEdit = (variantIds: string[]) => {
    setSelectedVariantIds(variantIds);
    setBulkEditOpen(true);
  };

  const handleBulkEditSuccess = () => {
    fetchVariants();
    setSelectedVariantIds([]);
  };

  const hasValidOptions = options.some(opt => opt.values && opt.values.length > 0);
  const canGenerate = hasValidOptions && !generating;

  return (
    <div className="space-y-6">
      {/* Enable Variations Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
        <div className="space-y-1">
          <Label htmlFor="variations-enabled" className="text-base font-semibold">
            Enable Variations
          </Label>
          <p className="text-sm text-gray-600">
            Create product options like Size, Color, Material, etc.
          </p>
        </div>
        <Switch
          id="variations-enabled"
          checked={variationsEnabled}
          onCheckedChange={onVariationsEnabledChange}
          disabled={loading}
        />
      </div>

      {!variationsEnabled ? (
        /* Empty State */
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Simple Product</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This product has no variations. Enable variations above to create options like
            Size, Color, or Material.
          </p>
        </div>
      ) : (
        /* Variations Editor */
        <div className="space-y-6">
          {/* Option Groups Editor */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Option Groups</h3>
            <OptionGroupsEditor
              productId={productId}
              options={options}
              onOptionsChange={fetchOptions}
            />
          </div>

          {/* Generate Variants Button */}
          {options.length > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
              <div>
                <p className="font-medium">Generate Variant Combinations</p>
                <p className="text-sm text-gray-600">
                  {hasValidOptions
                    ? 'Create all possible combinations from your options'
                    : 'Add at least one value to each option first'}
                </p>
              </div>
              <Button
                onClick={handleGenerateVariants}
                disabled={!canGenerate}
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Variants
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Variants ({variants.length})
                </h3>
              </div>
              <VariantTable
                productId={productId}
                variants={variants}
                onVariantsChange={fetchVariants}
                onBulkEdit={handleBulkEdit}
              />
            </div>
          )}
        </div>
      )}

      {/* Bulk Edit Modal */}
      <VariantBulkEdit
        productId={productId}
        variantIds={selectedVariantIds}
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  );
}
