CREATE TYPE "public"."product_status_v2" AS ENUM('DRAFT', 'READY');--> statement-breakpoint
CREATE TYPE "public"."product_type_v2" AS ENUM('OWN', 'POD', 'DIGITAL');--> statement-breakpoint
CREATE TYPE "public"."store_product_visibility_v2" AS ENUM('VISIBLE', 'HIDDEN');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_user_id_slug_unique" UNIQUE("user_id","slug")
);
--> statement-breakpoint
CREATE TABLE "external_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"external_product_id" text NOT NULL,
	"metadata_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_categories_pk" UNIQUE("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"url" text NOT NULL,
	"alt" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "product_tags_pk" UNIQUE("product_id","tag_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_id_slug_unique" UNIQUE("user_id","slug")
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "product_sources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_variants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_prices" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "store_products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_sources" CASCADE;--> statement-breakpoint
DROP TABLE "product_variants" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
DROP TABLE "store_prices" CASCADE;--> statement-breakpoint
DROP TABLE "store_products" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "pending_orders" DROP CONSTRAINT "pending_orders_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_v2" ADD CONSTRAINT "products_v2_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_prices_v2" ADD CONSTRAINT "store_prices_v2_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products_v2" ADD CONSTRAINT "store_products_v2_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products_v2" ADD CONSTRAINT "store_products_v2_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_v2_user_id_status_idx" ON "products_v2" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "store_prices_v2_store_id_idx" ON "store_prices_v2" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_products_v2_store_id_idx" ON "store_products_v2" USING btree ("store_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_product_id_products_v2_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."product_status";--> statement-breakpoint
DROP TYPE "public"."product_type";--> statement-breakpoint
DROP TYPE "public"."store_product_visibility";--> statement-breakpoint
DROP TYPE "public"."visibility_status";