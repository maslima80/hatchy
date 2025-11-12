ALTER TABLE "product_sources" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_sources" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "product_sources" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();