'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VariantTable } from './VariantTable';
import { createProduct, updateProduct, deleteProduct, type ProductFormData } from '@/app/actions/products';
import { useToast } from '@/components/ui/toast';

type ProductFormProps = {
  product?: {
    id: string;
    title: string;
    description?: string | null;
    productType: 'POD' | 'DROPSHIP' | 'OWN';
    status: 'DRAFT' | 'READY';
    defaultImageUrl?: string | null;
  };
  source?: {
    provider?: string | null;
    providerSku?: string | null;
    externalSupplierUrl?: string | null;
    leadTimeDays?: number | null;
    inventoryQty?: number | null;
    weightG?: number | null;
  };
  variants?: Array<{
    id: string;
    sku?: string | null;
    optionsJson?: string | null;
    costCents: number;
    priceCents: number;
  }>;
};

export function ProductForm({ product, source, variants: initialVariants }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [productType, setProductType] = useState<'POD' | 'DROPSHIP' | 'OWN'>(product?.productType || 'OWN');
  const [status, setStatus] = useState<'DRAFT' | 'READY'>(product?.status || 'DRAFT');
  const [defaultImageUrl, setDefaultImageUrl] = useState(product?.defaultImageUrl || '');

  // Source fields
  const [provider, setProvider] = useState(source?.provider || '');
  const [providerSku, setProviderSku] = useState(source?.providerSku || '');
  const [externalSupplierUrl, setExternalSupplierUrl] = useState(source?.externalSupplierUrl || '');
  const [leadTimeDays, setLeadTimeDays] = useState(source?.leadTimeDays?.toString() || '');
  const [inventoryQty, setInventoryQty] = useState(source?.inventoryQty?.toString() || '');
  const [weightG, setWeightG] = useState(source?.weightG?.toString() || '');

  // Variants
  const [variants, setVariants] = useState<Array<{
    id?: string;
    sku?: string;
    optionsJson?: string;
    costCents: number;
    priceCents: number;
  }>>(
    initialVariants?.map((v) => ({
      id: v.id,
      sku: v.sku || '',
      optionsJson: v.optionsJson || '',
      costCents: v.costCents,
      priceCents: v.priceCents,
    })) || [{ sku: '', optionsJson: '', costCents: 0, priceCents: 0 }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: ProductFormData = {
      title,
      description: description || undefined,
      productType,
      status,
      defaultImageUrl: defaultImageUrl || undefined,
      provider: provider || undefined,
      providerSku: providerSku || undefined,
      externalSupplierUrl: externalSupplierUrl || undefined,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays) : undefined,
      inventoryQty: inventoryQty ? parseInt(inventoryQty) : undefined,
      weightG: weightG ? parseInt(weightG) : undefined,
      variants,
    };

    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.id, formData);
          showToast('Product updated successfully', 'success');
        } else {
          const result = await createProduct(formData);
          showToast('Product created successfully', 'success');
          router.push('/dashboard/products');
        }
      } catch (error: any) {
        showToast(error.message || 'Something went wrong', 'error');
      }
    });
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm('Are you sure you want to delete this product?')) return;

    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      showToast('Product deleted successfully', 'success');
      router.push('/dashboard/products');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete product', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type *</Label>
              <Select
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value as 'POD' | 'DROPSHIP' | 'OWN')}
              >
                <option value="OWN">Own Inventory</option>
                <option value="POD">Print on Demand</option>
                <option value="DROPSHIP">Dropship</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'READY')}
              >
                <option value="DRAFT">Draft</option>
                <option value="READY">Ready</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultImageUrl">Default Image URL</Label>
            <Input
              id="defaultImageUrl"
              type="url"
              value={defaultImageUrl}
              onChange={(e) => setDefaultImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {defaultImageUrl && (
              <div className="mt-2">
                <img src={defaultImageUrl} alt="Preview" className="h-32 w-32 object-cover rounded border" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source Details - Conditional */}
      {productType === 'POD' && (
        <Card>
          <CardHeader>
            <CardTitle>POD Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="">Select provider</option>
                <option value="Printify">Printify</option>
                <option value="Printful">Printful</option>
                <option value="Manual">Manual</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerSku">Provider SKU</Label>
              <Input
                id="providerSku"
                value={providerSku}
                onChange={(e) => setProviderSku(e.target.value)}
                placeholder="SKU from provider"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {productType === 'DROPSHIP' && (
        <Card>
          <CardHeader>
            <CardTitle>Dropship Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="externalSupplierUrl">Supplier URL *</Label>
              <Input
                id="externalSupplierUrl"
                type="url"
                value={externalSupplierUrl}
                onChange={(e) => setExternalSupplierUrl(e.target.value)}
                placeholder="https://supplier.com/product"
                required={productType === 'DROPSHIP'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="7"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {productType === 'OWN' && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryQty">Inventory Quantity *</Label>
              <Input
                id="inventoryQty"
                type="number"
                value={inventoryQty}
                onChange={(e) => setInventoryQty(e.target.value)}
                placeholder="100"
                required={productType === 'OWN'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightG">Weight (grams)</Label>
              <Input
                id="weightG"
                type="number"
                value={weightG}
                onChange={(e) => setWeightG(e.target.value)}
                placeholder="500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <VariantTable variants={variants} onChange={setVariants} />
        </CardContent>
      </Card>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between gap-4 -mx-6 -mb-6">
        <div className="flex gap-2">
          {product && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isPending}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/products')}
            disabled={isPending || isDeleting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || isDeleting}>
            {isPending ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </form>
  );
}
