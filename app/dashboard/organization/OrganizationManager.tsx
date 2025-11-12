'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationTable } from './OrganizationTable';
import { Tag, FolderTree, Building2 } from 'lucide-react';

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface OrganizationManagerProps {
  initialCategories: OrganizationItem[];
  initialTags: OrganizationItem[];
  initialBrands: OrganizationItem[];
}

export function OrganizationManager({
  initialCategories,
  initialTags,
  initialBrands,
}: OrganizationManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [brands, setBrands] = useState(initialBrands);

  return (
    <Tabs defaultValue="categories" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="categories" className="flex items-center gap-2">
          <FolderTree className="w-4 h-4" />
          Categories
        </TabsTrigger>
        <TabsTrigger value="tags" className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </TabsTrigger>
        <TabsTrigger value="brands" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Brands
        </TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage your product categories. Edit names, merge duplicates, or delete unused ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationTable
              type="category"
              items={categories}
              onUpdate={setCategories}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tags">
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Manage your product tags. Edit names, merge duplicates, or delete unused ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationTable
              type="tag"
              items={tags}
              onUpdate={setTags}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="brands">
        <Card>
          <CardHeader>
            <CardTitle>Brands</CardTitle>
            <CardDescription>
              Manage your product brands. Edit names, merge duplicates, or delete unused ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationTable
              type="brand"
              items={brands}
              onUpdate={setBrands}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
