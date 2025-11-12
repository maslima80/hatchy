CREATE TYPE "public"."store_product_visibility" AS ENUM('VISIBLE', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('DRAFT', 'LIVE');--> statement-breakpoint
CREATE TYPE "public"."store_type" AS ENUM('HOTSITE', 'MINISTORE');--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"visibility" "store_product_visibility" DEFAULT 'VISIBLE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"type" "store_type" DEFAULT 'HOTSITE' NOT NULL,
	"status" "store_status" DEFAULT 'DRAFT' NOT NULL,
	"headline" text,
	"subheadline" text,
	"hero_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;