-- Phase 8.1: Variant Engine MVP
-- Create tables for product options, option values, and update variants

-- Add variations_enabled to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS variations_enabled BOOLEAN DEFAULT false;

-- Create product_options table
CREATE TABLE IF NOT EXISTS product_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Size", "Color"
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);

-- Create product_option_values table
CREATE TABLE IF NOT EXISTS product_option_values (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  option_id TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL, -- e.g., "Small", "Red"
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(option_id, value)
);

CREATE INDEX IF NOT EXISTS idx_product_option_values_option_id ON product_option_values(option_id);

-- Update variants table to support option combinations
ALTER TABLE variants ADD COLUMN IF NOT EXISTS option_values_json JSONB;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS cost_cents INTEGER;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster variant lookups
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_option_values ON variants USING gin(option_values_json);

-- Update store_prices to support variant-level pricing
ALTER TABLE store_prices ADD COLUMN IF NOT EXISTS variant_id TEXT REFERENCES variants(id) ON DELETE CASCADE;

-- Drop old unique constraint and create new one with variant_id
ALTER TABLE store_prices DROP CONSTRAINT IF EXISTS store_prices_store_id_product_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_prices_unique ON store_prices(store_id, product_id, COALESCE(variant_id, ''));

-- Add index for variant price lookups
CREATE INDEX IF NOT EXISTS idx_store_prices_variant_id ON store_prices(variant_id) WHERE variant_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE product_options IS 'Product variation options (e.g., Size, Color)';
COMMENT ON TABLE product_option_values IS 'Values for each option (e.g., Small, Medium, Large)';
COMMENT ON COLUMN variants.option_values_json IS 'JSON object mapping option names to values, e.g., {"Size":"M","Color":"Red"}';
COMMENT ON COLUMN store_prices.variant_id IS 'Optional variant-specific pricing. NULL means product-level price.';
