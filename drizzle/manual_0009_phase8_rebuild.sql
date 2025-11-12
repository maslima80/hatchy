-- Phase 8: Clean rebuild of product system
-- This migration drops old tables and creates new v2 schema

-- Step 0: Clear test data and drop foreign key constraints from orders and pending_orders first
DELETE FROM "orders" WHERE TRUE;
DELETE FROM "pending_orders" WHERE TRUE;
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_product_id_products_id_fk";
ALTER TABLE IF EXISTS "pending_orders" DROP CONSTRAINT IF EXISTS "pending_orders_product_id_products_id_fk";

-- Step 1: Drop old tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS "store_prices" CASCADE;
DROP TABLE IF EXISTS "store_products" CASCADE;
DROP TABLE IF EXISTS "product_variants" CASCADE;
DROP TABLE IF EXISTS "product_sources" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;

-- Step 2: Drop old enums
DROP TYPE IF EXISTS "product_status";
DROP TYPE IF EXISTS "product_type";
DROP TYPE IF EXISTS "store_product_visibility";
DROP TYPE IF EXISTS "visibility_status";

-- Step 3: Create new enums (IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "public"."product_status_v2" AS ENUM('DRAFT', 'READY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."product_type_v2" AS ENUM('OWN', 'POD', 'DIGITAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."store_product_visibility_v2" AS ENUM('VISIBLE', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 4: Create new tables
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_user_id_slug_unique" UNIQUE("user_id","slug")
);

CREATE TABLE "external_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"external_product_id" text NOT NULL,
	"metadata_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_categories_pk" UNIQUE("product_id","category_id")
);

CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"alt" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "product_tags" (
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "product_tags_pk" UNIQUE("product_id","tag_id")
);

CREATE TABLE "products_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" "product_type_v2" DEFAULT 'OWN' NOT NULL,
	"status" "product_status_v2" DEFAULT 'DRAFT' NOT NULL,
	"default_image_url" text,
	"weight_grams" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE TABLE "store_prices_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_prices_v2_unique" UNIQUE("store_id","product_id","variant_id")
);

CREATE TABLE "store_products_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"title_override" text,
	"description_override" text,
	"visibility" "store_product_visibility_v2" DEFAULT 'HIDDEN' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_products_v2_store_product_unique" UNIQUE("store_id","product_id")
);

CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_id_slug_unique" UNIQUE("user_id","slug")
);

CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100),
	"options_json" text,
	"cost_cents" integer,
	"price_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "variants_product_id_sku_unique" UNIQUE("product_id","sku")
);

-- Step 5: Add foreign keys
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "products_v2" ADD CONSTRAINT "products_v2_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_products_v2" ADD CONSTRAINT "store_products_v2_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "store_products_v2" ADD CONSTRAINT "store_products_v2_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;

-- Step 6: Update orders and pending_orders to reference new products table
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;

-- Step 7: Create indexes
CREATE INDEX "products_v2_user_id_status_idx" ON "products_v2" USING btree ("user_id","status");
CREATE INDEX "store_prices_v2_store_id_idx" ON "store_prices_v2" USING btree ("store_id");
CREATE INDEX "store_products_v2_store_id_idx" ON "store_products_v2" USING btree ("store_id");
