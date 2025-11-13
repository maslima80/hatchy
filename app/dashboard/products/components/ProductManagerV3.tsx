'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Package, Image as ImageIcon, DollarSign, Palette, 
  Tag, Layers, MessageSquare, Save, Eye 
} from 'lucide-react';
import type { ProductWithRelations } from '@/lib/products';
import { ImageKitUploader } from './ImageKitUploader';
import { OrganizationCombobox } from './OrganizationCombobox';
import { VariationsTab } from './variants/VariationsTab';

interface ProductManagerV3Props {
  product?: ProductWithRelations;
  userCategories: any[];
  userTags: any[];
  userBrands: any[];
}

export function ProductManagerV3({ 
  product, 
  userCategories, 
  userTags,
  userBrands 
}: ProductManagerV3Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    title: product?.title || '',
    description: product?.description || '',
    type: product?.type || 'OWN',
    youtubeUrl: product?.youtubeUrl || '',
    
    // Pricing & Inventory
    priceCents: product?.variants?.[0]?.priceCents || 0,
    compareAtPriceCents: product?.compareAtPriceCents || 0,
    sku: product?.variants?.[0]?.sku || '',
    unit: product?.unit || 'Unit',
    trackInventory: product?.trackInventory || false,
    quantity: product?.quantity || 0,
    
    // Organization
    categoryIds: product?.categories?.map(c => c.id) || [],
    tagIds: product?.tags?.map(t => t.id) || [],
    brandId: product?.brandId || null,
    
    // Variations
    variationsEnabled: (product?.variants?.length || 0) > 1,
    
    // Personalization
    personalizationEnabled: product?.personalizationEnabled || false,
    personalizationPrompt: product?.personalizationPrompt || '',
    
    // Status
    status: product?.status || 'DRAFT',
  });

  
  // Local state for categories/tags/brands
  const [categories, setCategories] = useState(userCategories);
  const [tags, setTags] = useState(userTags);
  const [brands, setBrands] = useState(userBrands);
  
  // Media state
  const [productImages, setProductImages] = useState<Array<{ id: string; url: string; alt?: string | null }>>([]);
  
  // Price input states (for smooth typing)
  const [priceInput, setPriceInput] = useState((formData.priceCents / 100).toFixed(2));
  const [compareAtPriceInput, setCompareAtPriceInput] = useState((formData.compareAtPriceCents / 100).toFixed(2));

  // Fetch product images on mount
  useEffect(() => {
    if (product?.id) {
      fetchProductImages();
    }
  }, [product?.id]);

  const fetchProductImages = async () => {
    if (!product?.id) return;
    try {
      const response = await fetch(`/api/products/${product.id}/media`);
      if (response.ok) {
        const data = await response.json();
        setProductImages(data.media || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };

  // Auto-save on blur
  const handleAutoSave = async () => {
    if (!product?.id) return;
    
    setAutoSaving(true);
    try {
      await saveProduct();
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const saveProduct = async () => {
    if (!product?.id) return;

    const response = await fetch(`/api/products/${product.id}/save-v3`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to save');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProduct();
      router.refresh();
    } catch (error) {
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Organization handlers
  const handleCreateCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories/inline-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories([...categories, data.category]);
        setFormData({
          ...formData,
          categoryIds: [...formData.categoryIds, data.category.id],
        });
        if (product?.id) await handleAutoSave();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleSelectCategory = (id: string) => {
    const newIds = formData.categoryIds.includes(id)
      ? formData.categoryIds
      : [...formData.categoryIds, id];
    setFormData({ ...formData, categoryIds: newIds });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  const handleRemoveCategory = (id: string) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.filter(cid => cid !== id),
    });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  const handleCreateTag = async (name: string) => {
    try {
      const response = await fetch('/api/tags/inline-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.success) {
        setTags([...tags, data.tag]);
        setFormData({
          ...formData,
          tagIds: [...formData.tagIds, data.tag.id],
        });
        if (product?.id) await handleAutoSave();
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleSelectTag = (id: string) => {
    const newIds = formData.tagIds.includes(id)
      ? formData.tagIds
      : [...formData.tagIds, id];
    setFormData({ ...formData, tagIds: newIds });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  const handleRemoveTag = (id: string) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.filter(tid => tid !== id),
    });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  const handleCreateBrand = async (name: string) => {
    try {
      const response = await fetch('/api/brands/inline-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.success) {
        setBrands([...brands, data.brand]);
        setFormData({ ...formData, brandId: data.brand.id });
        if (product?.id) await handleAutoSave();
      }
    } catch (error) {
      console.error('Failed to create brand:', error);
    }
  };

  const handleSelectBrand = (id: string) => {
    setFormData({ ...formData, brandId: id });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  const handleRemoveBrand = () => {
    setFormData({ ...formData, brandId: null });
    if (product?.id) setTimeout(handleAutoSave, 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            Products / {product ? 'Edit' : 'Add New'}
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            Product Manager
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={formData.status === 'DRAFT' ? 'outline' : 'default'}>
            {formData.status}
          </Badge>
          {autoSaving && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
                {product?.source === 'printify' && (
                  <Badge variant="outline" className="ml-2">
                    Printify
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Essential product details that customers will see
                {product?.externalId && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (ID: {product.externalId})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onBlur={handleAutoSave}
                  placeholder="E.g., Premium Cotton T-Shirt"
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onBlur={handleAutoSave}
                  placeholder="Describe your product in detail..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Media
              </CardTitle>
              <CardDescription>
                Add images and videos to showcase your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ImageKit Upload */}
              {product?.id && (
                <ImageKitUploader
                  productId={product.id}
                  existingImages={productImages}
                  onUploadComplete={(url: string) => {
                    fetchProductImages();
                  }}
                  onDeleteImage={(mediaId: string) => {
                    setProductImages(productImages.filter(img => img.id !== mediaId));
                  }}
                />
              )}

              {!product?.id && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">
                    Save the product first to upload images
                  </p>
                </div>
              )}

              {/* YouTube URL */}
              <div>
                <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                  <span>📹</span> YouTube Video URL
                </Label>
                <Input
                  id="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  onBlur={handleAutoSave}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Inventory
              </CardTitle>
              <CardDescription>
                Set your pricing and track inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    value={priceInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow digits, one decimal point, and empty string
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setPriceInput(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const parsed = parseFloat(value || '0');
                      if (!isNaN(parsed)) {
                        const formatted = parsed.toFixed(2);
                        setPriceInput(formatted);
                        setFormData({ 
                          ...formData, 
                          priceCents: Math.round(parsed * 100) 
                        });
                        handleAutoSave();
                      } else {
                        setPriceInput('0.00');
                        setFormData({ ...formData, priceCents: 0 });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="compareAt">Compare at Price</Label>
                  <Input
                    id="compareAt"
                    type="text"
                    inputMode="decimal"
                    value={compareAtPriceInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow digits, one decimal point, and empty string
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setCompareAtPriceInput(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const parsed = parseFloat(value || '0');
                      if (!isNaN(parsed)) {
                        const formatted = parsed.toFixed(2);
                        setCompareAtPriceInput(formatted);
                        setFormData({ 
                          ...formData, 
                          compareAtPriceCents: Math.round(parsed * 100) 
                        });
                        handleAutoSave();
                      } else {
                        setCompareAtPriceInput('0.00');
                        setFormData({ ...formData, compareAtPriceCents: 0 });
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    onBlur={handleAutoSave}
                    placeholder="PROD-001"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    onBlur={handleAutoSave}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Unit">Unit</option>
                    <option value="Pound">Pound</option>
                    <option value="Kilogram">Kilogram</option>
                    <option value="Meter">Meter</option>
                    <option value="Package">Package</option>
                  </select>
                </div>
              </div>

              {/* Track Inventory Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Track Inventory</Label>
                  <p className="text-sm text-gray-600">Monitor stock levels for this product</p>
                </div>
                <Switch
                  checked={formData.trackInventory}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, trackInventory: checked });
                    setTimeout(handleAutoSave, 100);
                  }}
                />
              </div>

              {formData.trackInventory && (
                <div>
                  <Label htmlFor="quantity">Quantity in Stock</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value || '0') })}
                    onBlur={handleAutoSave}
                    placeholder="0"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Variations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Product Variations
              </CardTitle>
              <CardDescription>
                Create options like Size, Color, Material, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product?.id ? (
                <VariationsTab
                  productId={product.id}
                  variationsEnabled={formData.variationsEnabled}
                  onVariationsEnabledChange={async (enabled) => {
                    setFormData({ ...formData, variationsEnabled: enabled });
                    // Auto-save the variations_enabled flag
                    if (product?.id) {
                      try {
                        await fetch(`/api/products/${product.id}/save-v3`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ variationsEnabled: enabled }),
                        });
                      } catch (error) {
                        console.error('Failed to save variations_enabled:', error);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Save the product first to enable variations
                </p>
              )}
            </CardContent>
          </Card>

          {/* Personalization Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Personalization Options
                  </CardTitle>
                  <CardDescription>
                    Allow customers to personalize this product
                  </CardDescription>
                </div>
                <Switch
                  checked={formData.personalizationEnabled}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, personalizationEnabled: checked });
                    setTimeout(handleAutoSave, 100);
                  }}
                />
              </div>
            </CardHeader>
            {formData.personalizationEnabled && (
              <CardContent>
                <Label htmlFor="personalizationPrompt">Personalization Prompt</Label>
                <Textarea
                  id="personalizationPrompt"
                  value={formData.personalizationPrompt}
                  onChange={(e) => setFormData({ ...formData, personalizationPrompt: e.target.value })}
                  onBlur={handleAutoSave}
                  placeholder="E.g., Enter the name you'd like engraved (max 20 characters)"
                  rows={3}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          
          {/* Product Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Product Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                onBlur={handleAutoSave}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm"
              >
                <option value="OWN">Own Product</option>
                <option value="POD">Print on Demand</option>
                <option value="DIGITAL">Digital Product</option>
              </select>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Organization
              </CardTitle>
              <CardDescription>
                Categorize your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrganizationCombobox
                label="Categories"
                placeholder="Add category..."
                options={categories}
                selectedIds={formData.categoryIds}
                onSelect={handleSelectCategory}
                onRemove={handleRemoveCategory}
                onCreate={handleCreateCategory}
                multiple={true}
              />

              <OrganizationCombobox
                label="Tags"
                placeholder="Add tag..."
                options={tags}
                selectedIds={formData.tagIds}
                onSelect={handleSelectTag}
                onRemove={handleRemoveTag}
                onCreate={handleCreateTag}
                multiple={true}
              />

              <OrganizationCombobox
                label="Brands"
                placeholder="Add brand..."
                options={brands}
                selectedIds={formData.brandId ? [formData.brandId] : []}
                onSelect={handleSelectBrand}
                onRemove={handleRemoveBrand}
                onCreate={handleCreateBrand}
                multiple={false}
              />
            </CardContent>
          </Card>

          {/* Visibility & Publishing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Visibility & Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm mt-2"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready</option>
                </select>
              </div>

              {product && (
                <Button variant="outline" className="w-full">
                  View on Store
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
