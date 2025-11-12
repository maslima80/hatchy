'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductBasicsTab } from './ProductBasicsTab';
import { ProductVariantsTab } from './ProductVariantsTab';
import { ProductPublishingTab } from './ProductPublishingTab';
import type { ProductWithRelations } from '@/lib/products';
import type { categories, tags } from '@/lib/db/schema';

type Tab = 'basics' | 'variants' | 'publishing';

interface ProductEditorTabsProps {
  product: ProductWithRelations;
  userCategories: (typeof categories.$inferSelect)[];
  userTags: (typeof tags.$inferSelect)[];
}

export function ProductEditorTabs({
  product,
  userCategories,
  userTags,
}: ProductEditorTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('basics');

  const tabs = [
    { id: 'basics' as Tab, label: 'Basics', description: 'Product details' },
    { id: 'variants' as Tab, label: 'Variants & Media', description: 'Options and gallery' },
    { id: 'publishing' as Tab, label: 'Publishing', description: 'Stores and pricing' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex flex-col items-start">
                  <span>{tab.label}</span>
                  <span className="text-xs text-gray-400">{tab.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basics' && (
            <ProductBasicsTab
              product={product}
              userCategories={userCategories}
              userTags={userTags}
            />
          )}
          {activeTab === 'variants' && (
            <ProductVariantsTab product={product} />
          )}
          {activeTab === 'publishing' && (
            <ProductPublishingTab product={product} />
          )}
        </div>
      </Card>
    </div>
  );
}
