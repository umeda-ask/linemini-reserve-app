ALTER TABLE "booking_reservations" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_reservations" ALTER COLUMN "time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_courses" ADD COLUMN "enable_request_mode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "booking_reservations" ADD COLUMN "customer_note" text;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD COLUMN "cancel_limit_days" integer DEFAULT 1;