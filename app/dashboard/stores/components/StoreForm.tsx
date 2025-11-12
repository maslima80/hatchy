'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreProductPicker } from './StoreProductPicker';
import { createStore, updateStore, deleteStore, type StoreFormData } from '@/app/actions/stores';
import { useToast } from '@/components/ui/toast';

type Product = {
  id: string;
  title: string;
  productType: 'POD' | 'DROPSHIP' | 'OWN';
  defaultImageUrl?: string | null;
};

type StoreFormProps = {
  store?: {
    id: string;
    name: string;
    slug: string;
    type: 'HOTSITE' | 'MINISTORE';
    status: 'DRAFT' | 'LIVE';
    headline?: string | null;
    subheadline?: string | null;
    heroImageUrl?: string | null;
  };
  storeProductIds?: string[];
  availableProducts: Product[];
};

export function StoreForm({ store, storeProductIds = [], availableProducts }: StoreFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [name, setName] = useState(store?.name || '');
  const [slug, setSlug] = useState(store?.slug || '');
  const [type, setType] = useState<'HOTSITE' | 'MINISTORE'>(store?.type || 'HOTSITE');
  const [status, setStatus] = useState<'DRAFT' | 'LIVE'>(store?.status || 'DRAFT');
  const [headline, setHeadline] = useState(store?.headline || '');
  const [subheadline, setSubheadline] = useState(store?.subheadline || '');
  const [heroImageUrl, setHeroImageUrl] = useState(store?.heroImageUrl || '');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(storeProductIds);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!store) {
      // Only auto-generate for new stores
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: StoreFormData = {
      name,
      slug,
      type,
      status,
      headline: headline || undefined,
      subheadline: subheadline || undefined,
      heroImageUrl: heroImageUrl || undefined,
      productIds: selectedProductIds,
    };

    startTransition(async () => {
      try {
        if (store) {
          await updateStore(store.id, formData);
          showToast('Store updated successfully', 'success');
          router.push('/dashboard/stores');
        } else {
          const result = await createStore(formData);
          showToast('Store created successfully', 'success');
          router.push('/dashboard/stores');
        }
      } catch (error: any) {
        showToast(error.message || 'Something went wrong', 'error');
      }
    });
  };

  const handleDelete = async () => {
    if (!store) return;
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await deleteStore(store.id);
      showToast('Store deleted successfully', 'success');
      router.push('/dashboard/stores');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete store', 'error');
      setIsDeleting(false);
    }
  };

  const canProceedToStep2 = name && slug && type;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            1
          </div>
          <span>Store Details</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div
          className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            2
          </div>
          <span>Select Products</span>
        </div>
      </div>

      {/* Step 1: Store Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Store"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/s/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-awesome-store"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Your store will be available at: /s/{slug || 'your-slug'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Store Type *</Label>
              <Select id="type" value={type} onChange={(e) => setType(e.target.value as 'HOTSITE' | 'MINISTORE')}>
                <option value="HOTSITE">Hotsite (Single Product)</option>
                <option value="MINISTORE">Mini-Store (Multiple Products)</option>
              </Select>
              <p className="text-xs text-gray-500">
                {type === 'HOTSITE'
                  ? 'Perfect for launching one product with maximum impact'
                  : 'Showcase multiple products in a grid layout'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Welcome to our store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Textarea
                id="subheadline"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Discover amazing products"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImageUrl">Hero Image URL</Label>
              <Input
                id="heroImageUrl"
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://example.com/hero.jpg"
              />
              {heroImageUrl && (
                <div className="mt-2">
                  <img src={heroImageUrl} alt="Hero preview" className="h-32 w-full object-cover rounded border" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'LIVE')}>
                <option value="DRAFT">Draft</option>
                <option value="LIVE">Live</option>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="button" onClick={() => setStep(2)} disabled={!canProceedToStep2}>
                Next: Select Products →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
          </CardHeader>
          <CardContent>
            <StoreProductPicker
              products={availableProducts}
              selectedIds={selectedProductIds}
              onChange={setSelectedProductIds}
              storeType={type}
            />
          </CardContent>
        </Card>
      )}

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between gap-4 -mx-6 -mb-6">
        <div className="flex gap-2">
          {store && step === 1 && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isPending}>
              {isDeleting ? 'Deleting...' : 'Delete Store'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step === 2 && (
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending || isDeleting}>
              ← Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/stores')}
            disabled={isPending || isDeleting}
          >
            Cancel
          </Button>
          {step === 2 && (
            <Button type="submit" disabled={isPending || isDeleting || selectedProductIds.length === 0}>
              {isPending ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
