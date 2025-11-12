ALTER TABLE "profiles" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "brand_name";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "brand_color";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "logo_url";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "website";