import { neon } from "@neondatabase/serverless";

  export async function runMigrations() {
    const sql = neon(process.env.DATABASE_URL!);
    // shop_menu_items テーブル作成
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS shop_menu_items (
          id            SERIAL PRIMARY KEY,
          shop_id       INTEGER NOT NULL,
          name          TEXT NOT NULL,
          price         INTEGER NOT NULL DEFAULT 0,
          comment       TEXT NOT NULL DEFAULT '',
          image_url     TEXT,
          is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `;
    } catch (e: any) {
      console.warn("shop_menu_items migration warning:", e.message?.substring(0, 100));
    }
    console.log("Migrations completed.");
  }
  