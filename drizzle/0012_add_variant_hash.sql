-- Migration: Add option_values_hash for variant uniqueness
-- This ensures we can't create duplicate variants with the same option combinations

-- Add hash column
ALTER TABLE "variants" 
ADD COLUMN "option_values_hash" TEXT;

-- Create function to generate hash from option_values_json
CREATE OR REPLACE FUNCTION generate_option_values_hash(option_values_json TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Generate SHA256 hash of the sorted JSON keys and values
  -- This ensures consistent hashing regardless of key order
  RETURN encode(
    digest(
      (
        SELECT string_agg(key || ':' || value, '|' ORDER BY key)
        FROM jsonb_each_text(option_values_json::jsonb)
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing variants with hash
UPDATE "variants"
SET "option_values_hash" = generate_option_values_hash(COALESCE("option_values_json", '{}'))
WHERE "option_values_json" IS NOT NULL;

-- Create unique constraint
CREATE UNIQUE INDEX "variants_product_id_option_values_hash_unique" 
ON "variants" ("product_id", "option_values_hash")
WHERE "deleted_at" IS NULL;

-- Add trigger to auto-generate hash on insert/update
CREATE OR REPLACE FUNCTION update_variant_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.option_values_json IS NOT NULL THEN
    NEW.option_values_hash = generate_option_values_hash(NEW.option_values_json);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER variant_hash_trigger
BEFORE INSERT OR UPDATE OF option_values_json ON "variants"
FOR EACH ROW
EXECUTE FUNCTION update_variant_hash();
