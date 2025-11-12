CREATE TYPE "public"."product_status" AS ENUM('DRAFT', 'READY');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('POD', 'DROPSHIP', 'OWN');--> statement-breakpoint
CREATE TABLE "product_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"provider" varchar(100),
	"provider_sku" varchar(100),
	"external_supplier_url" text,
	"lead_time_days" integer,
	"inventory_qty" integer,
	"weight_g" integer
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" varchar(100),
	"options_json" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "title" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'OWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" "product_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "default_image_url" text;--> statement-breakpoint
ALTER TABLE "product_sources" ADD CONSTRAINT "product_sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_active";