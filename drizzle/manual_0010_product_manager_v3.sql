-- Product Manager v3 - Enhanced UX Fields
-- Add new fields to products_v2 table

-- Add new columns to products_v2
ALTER TABLE products_v2 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'Unit',
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS personalization_prompt TEXT,
ADD COLUMN IF NOT EXISTS brand_id UUID;

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, slug)
);

-- Add foreign key for brand_id
ALTER TABLE products_v2
ADD CONSTRAINT products_v2_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- Create index for brands
CREATE INDEX IF NOT EXISTS brands_user_id_idx ON brands(user_id);

-- Add index for product brand lookups
CREATE INDEX IF NOT EXISTS products_v2_brand_id_idx ON products_v2(brand_id);
