'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import type { ProductWithRelations } from '@/lib/products';
import type { categories, tags } from '@/lib/db/schema';

interface ProductBasicsTabProps {
  product: ProductWithRelations;
  userCategories: (typeof categories.$inferSelect)[];
  userTags: (typeof tags.$inferSelect)[];
}

export function ProductBasicsTab({
  product,
  userCategories,
  userTags,
}: ProductBasicsTabProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description || '',
    type: product.type,
    status: product.status,
    defaultImageUrl: product.defaultImageUrl || '',
    weightGrams: product.weightGrams || 0,
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product.categories?.map((c) => c.id) || []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    product.tags?.map((t) => t.id) || []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      router.refresh();
      alert('Product updated successfully!');
    } catch (error) {
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Product name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Product description"
          rows={4}
        />
      </div>

      {/* Type and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any })
            }
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="OWN">Own</option>
            <option value="POD">POD</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <Label htmlFor="imageUrl">Default Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.defaultImageUrl}
          onChange={(e) =>
            setFormData({ ...formData, defaultImageUrl: e.target.value })
          }
          placeholder="https://example.com/image.jpg"
        />
        {formData.defaultImageUrl && (
          <div className="mt-2">
            <img
              src={formData.defaultImageUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
            />
          </div>
        )}
      </div>

      {/* Weight */}
      <div>
        <Label htmlFor="weight">Weight (grams)</Label>
        <Input
          id="weight"
          type="number"
          value={formData.weightGrams}
          onChange={(e) =>
            setFormData({ ...formData, weightGrams: parseInt(e.target.value) || 0 })
          }
          placeholder="0"
        />
      </div>

      {/* Categories */}
      <div>
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {userCategories.map((category) => (
            <Badge
              key={category.id}
              variant={
                selectedCategoryIds.includes(category.id) ? 'default' : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
              {selectedCategoryIds.includes(category.id) && (
                <X className="w-3 h-3 ml-1" />
              )}
            </Badge>
          ))}
          {userCategories.length === 0 && (
            <p className="text-sm text-gray-500">
              No categories yet. Create them in settings.
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {userTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              #{tag.name}
              {selectedTagIds.includes(tag.id) && <X className="w-3 h-3 ml-1" />}
            </Badge>
          ))}
          {userTags.length === 0 && (
            <p className="text-sm text-gray-500">
              No tags yet. Create them in settings.
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
