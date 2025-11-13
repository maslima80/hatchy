-- Migration: Printify Integration (Phase 9)
-- Add tables and columns to support Printify product import

-- 1. Create printify_connections table
CREATE TABLE IF NOT EXISTS "printify_connections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "api_key" TEXT NOT NULL,
  "default_shop_id" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "printify_connections_user_id_unique" UNIQUE("user_id")
);

-- Index for faster lookups
CREATE INDEX "printify_connections_user_id_idx" ON "printify_connections"("user_id");

-- 2. Add source tracking columns to products table
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS "external_id" TEXT,
ADD COLUMN IF NOT EXISTS "external_provider" TEXT;

-- Index for external product lookups
CREATE INDEX IF NOT EXISTS "products_external_id_idx" ON "products"("external_id", "external_provider");

-- 3. Add external tracking columns to variants table
ALTER TABLE "variants"
ADD COLUMN IF NOT EXISTS "external_id" TEXT,
ADD COLUMN IF NOT EXISTS "external_provider" TEXT;

-- Index for external variant lookups
CREATE INDEX IF NOT EXISTS "variants_external_id_idx" ON "variants"("external_id", "external_provider");

-- 4. Ensure cost_cents exists on variants (may already exist)
-- This is safe to run even if column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'variants' AND column_name = 'cost_cents'
  ) THEN
    ALTER TABLE "variants" ADD COLUMN "cost_cents" INTEGER;
  END IF;
END $$;

-- 5. Add check constraint for valid sources
ALTER TABLE "products" 
ADD CONSTRAINT "products_source_check" 
CHECK ("source" IN ('manual', 'printify', 'dropshipping', 'digital'));

-- Comments for documentation
COMMENT ON TABLE "printify_connections" IS 'Stores user Printify API credentials and default shop';
COMMENT ON COLUMN "products"."source" IS 'Product source: manual, printify, dropshipping, or digital';
COMMENT ON COLUMN "products"."external_id" IS 'External provider product ID (e.g., Printify product ID)';
COMMENT ON COLUMN "products"."external_provider" IS 'External provider name (e.g., printify)';
COMMENT ON COLUMN "variants"."external_id" IS 'External provider variant ID';
COMMENT ON COLUMN "variants"."external_provider" IS 'External provider name for variant';
