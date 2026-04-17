ALTER TABLE "booking_settings" ALTER COLUMN "staff_selection_enabled" DROP DEFAULT;
ALTER TABLE "booking_settings" ALTER COLUMN "staff_selection_enabled" SET DATA TYPE boolean USING staff_selection_enabled::boolean;--> statement-breakpoint
ALTER TABLE "booking_settings" ALTER COLUMN "staff_selection_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "table_count";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "max_party_size";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "staff_selection_enabled";