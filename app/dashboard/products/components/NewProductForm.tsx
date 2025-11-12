'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Package, Sparkles } from 'lucide-react';
import { createProduct } from '@/app/actions/products';

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'OWN' as 'OWN' | 'POD' | 'DIGITAL',
    status: 'DRAFT' as 'DRAFT' | 'READY',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Product title is required');
      return;
    }

    setLoading(true);
    try {
      // Create product with one default variant
      const result = await createProduct({
        ...formData,
        variants: [
          {
            sku: '',
            optionsJson: '{}',
            costCents: 0,
            priceCents: 0,
          },
        ],
      });

      if (result.success) {
        // Redirect to the beautiful new editor
        router.push(`/dashboard/products/${result.productId}`);
        router.refresh();
      }
    } catch (error: any) {
      console.error('Create product error:', error);
      alert(error.message || 'Failed to create product');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-50 rounded-full">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Product</CardTitle>
          <CardDescription className="text-base">
            Start with the basics - you'll add images, pricing, and details next
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-medium">
                Product Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Premium Cotton T-Shirt"
                className="mt-2 text-lg h-12"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-medium">
                Quick Description <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief overview of your product..."
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type" className="text-base font-medium">
                Product Type
              </Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full h-12 px-4 mt-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="OWN">📦 Own Product (Physical goods you ship)</option>
                <option value="POD">🎨 Print on Demand (Printify, etc.)</option>
                <option value="DIGITAL">💾 Digital Product (Downloads, courses)</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What happens next?</p>
                <p className="text-blue-700">
                  You'll be taken to the full Product Manager where you can add images, 
                  set pricing, manage inventory, and publish to your stores.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/products')}
                disabled={loading}
                className="h-12"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
