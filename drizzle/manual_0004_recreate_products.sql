-- Drop existing tables (they're empty anyway from Phase 2)
DROP TABLE IF EXISTS "product_variants" CASCADE;
DROP TABLE IF EXISTS "product_sources" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;

-- Create enums (drop first if they exist)
DROP TYPE IF EXISTS "product_type" CASCADE;
CREATE TYPE "product_type" AS ENUM('POD', 'DROPSHIP', 'OWN');

DROP TYPE IF EXISTS "product_status" CASCADE;
CREATE TYPE "product_status" AS ENUM('DRAFT', 'READY');

-- Create products table with new schema
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"product_type" "product_type" DEFAULT 'OWN' NOT NULL,
	"status" "product_status" DEFAULT 'DRAFT' NOT NULL,
	"default_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create product_sources table
CREATE TABLE "product_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"provider" varchar(100),
	"provider_sku" varchar(100),
	"external_supplier_url" text,
	"lead_time_days" integer,
	"inventory_qty" integer,
	"weight_g" integer
);

-- Create product_variants table
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100),
	"options_json" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL
);

-- Add foreign keys
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "product_sources" ADD CONSTRAINT "product_sources_product_id_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" 
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
