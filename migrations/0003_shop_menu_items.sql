CREATE TABLE "shop_menu_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shop_id" integer NOT NULL,
  	"name" text NOT NULL,
  	"price" integer DEFAULT 0 NOT NULL,
  	"comment" text DEFAULT '' NOT NULL,
  	"image_url" text,
  	"is_visible" boolean DEFAULT true NOT NULL,
  	"display_order" integer DEFAULT 0 NOT NULL,
  	"created_at" timestamp with time zone DEFAULT now() NOT NULL
  );
  