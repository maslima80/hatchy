'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Package, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface Shop {
  id: number;
  title: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  images: { src: string }[];
  print_provider_id: number;
  options: { name: string; values: any[] }[];
  variants: any[];
}

export default function ImportFromPrintifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [hasConnection, setHasConnection] = useState(false);
  
  // Step 1: Shop selection
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Step 2: Product list
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Step 3: Preview & import
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedProductId, setImportedProductId] = useState('');
  const [variantCount, setVariantCount] = useState(0);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Filter products when search changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/integrations/printify/shops');
      
      if (response.ok) {
        const data = await response.json();
        setHasConnection(true);
        setShops(data.shops || []);
        setSelectedShopId(data.defaultShopId || (data.shops[0]?.id ? String(data.shops[0].id) : ''));
      } else {
        setHasConnection(false);
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
      setHasConnection(false);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!selectedShopId) return;
    
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/integrations/printify/shops/${selectedShopId}/products`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products response:', data);
        const productsList = Array.isArray(data.products) ? data.products : [];
        setProducts(productsList);
        setFilteredProducts(productsList);
        setStep(2);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load products:', errorData);
        alert(errorData.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadProductDetails = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/integrations/printify/shops/${selectedShopId}/products/${productId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data.product);
        setSelectedProductId(productId);
        setStep(3);
      } else {
        alert('Failed to load product details');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProduct) return;
    
    setImporting(true);
    try {
      const response = await fetch('/api/integrations/printify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShopId,
          productId: selectedProduct.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportedProductId(data.productId);
        setVariantCount(data.variantCount);
        // Success - stay on step 3 to show success message
      } else {
        alert(data.error || 'Failed to import product');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Redirect to settings if no connection
  if (!loading && !hasConnection) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Connect Printify First</CardTitle>
            <CardDescription>
              You need to connect your Printify account before importing products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/settings')}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/products')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Import from Printify</h1>
        <p className="text-gray-600 mt-1">
          Step {step} of 3: {step === 1 ? 'Choose Shop' : step === 2 ? 'Select Product' : 'Preview & Import'}
        </p>
      </div>

      {/* Step 1: Choose Shop */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Shop</CardTitle>
            <CardDescription>Select which Printify shop to import from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shop">Printify Shop</Label>
              <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                <SelectTrigger id="shop">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={String(shop.id)}>
                      {shop.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={loadProducts}
              disabled={!selectedShopId || loadingProducts}
            >
              {loadingProducts && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product List */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Product</CardTitle>
            <CardDescription>
              Choose a product to import ({filteredProducts.length} products)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => loadProductDetails(product.id)}
                >
                  {product.images[0] && (
                    <div className="relative w-full h-48 mb-3 bg-gray-100 rounded">
                      <Image
                        src={product.images[0].src}
                        alt={product.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Badge variant="outline" className="text-xs">
                      {product.variants.filter((v: any) => v.is_enabled).length} variants
                    </Badge>
                    {product.options.length > 0 && (
                      <span>{product.options.map(o => o.name).join(', ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {(!Array.isArray(filteredProducts) || filteredProducts.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? 'No products match your search' : 'No products found'}
              </div>
            )}

            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview & Import */}
      {step === 3 && selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>
              {importedProductId ? 'Import Successful!' : 'Preview & Import'}
            </CardTitle>
            <CardDescription>
              {importedProductId 
                ? 'Your product has been imported into Hatchy'
                : 'Review the product details before importing'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!importedProductId ? (
              <>
                {/* Product Preview */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    {selectedProduct.images[0] && (
                      <div className="relative w-full h-64 bg-gray-100 rounded-lg">
                        <Image
                          src={selectedProduct.images[0].src}
                          alt={selectedProduct.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    {selectedProduct.images.length > 1 && (
                      <p className="text-sm text-gray-600 mt-2">
                        +{selectedProduct.images.length - 1} more images
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProduct.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>Print on Demand</Badge>
                        <Badge variant="outline">Printify</Badge>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">Options:</p>
                        <p className="text-gray-600">
                          {selectedProduct.options.map(o => `${o.name} (${o.values.length} values)`).join(', ')}
                        </p>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">Variants:</p>
                        <p className="text-gray-600">
                          {selectedProduct.variants.filter((v: any) => v.is_enabled).length} combinations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>What happens next:</strong> We'll import this product into your Hatchy catalog. 
                    You'll be able to edit images, text, and set your own prices before publishing it to a store.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Package className="w-4 h-4 mr-2" />
                    Import Product
                  </Button>
                  <Button variant="outline" onClick={() => setStep(2)} disabled={importing}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{selectedProduct.title}</h3>
                  <p className="text-gray-600 mb-4">
                    {variantCount} variant{variantCount !== 1 ? 's' : ''} imported
                  </p>
                  <Badge variant="outline">Source: Printify</Badge>
                </div>

                {/* Warning about pricing */}
                {variantCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-900">
                      <strong>⚠️ Set prices before publishing:</strong> This product has no prices yet. 
                      Set prices in the 'Variants' section before publishing it to a store.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push(`/dashboard/products/${importedProductId}`)}>
                    Edit Product Details
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/products')}>
                    Back to Products
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
