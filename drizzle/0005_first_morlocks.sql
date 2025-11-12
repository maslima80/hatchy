CREATE TYPE "public"."visibility_status" AS ENUM('VISIBLE', 'HIDDEN', 'SCHEDULED');--> statement-breakpoint
CREATE TABLE "store_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_product_id" uuid NOT NULL,
	"variant_id" uuid,
	"price_cents" integer NOT NULL,
	"compare_at_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"visibility" "visibility_status" DEFAULT 'VISIBLE' NOT NULL,
	"start_at" timestamp,
	"end_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_prices" ADD CONSTRAINT "store_prices_store_product_id_store_products_id_fk" FOREIGN KEY ("store_product_id") REFERENCES "public"."store_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_prices" ADD CONSTRAINT "store_prices_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;