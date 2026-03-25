import { db } from "../server/db";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

async function initializeDatabase() {
  try {
    console.log("Creating tables...");

    // Create enums
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'shop_admin');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE discount_type AS ENUM ('AMOUNT', 'PERCENTAGE', 'FREE');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'VISITED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("✓ Enums created");

    // Create tables using drizzle
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'shop_admin',
        shop_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sub_categories (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        category_id INTEGER NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        area_id INTEGER NOT NULL,
        area TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        subcategory TEXT,
        address TEXT NOT NULL,
        phone TEXT,
        hours TEXT,
        closed_days TEXT,
        website TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        line_account_url TEXT,
        image_url TEXT NOT NULL,
        gallery_image_urls TEXT[],
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        enable_staff_assignment BOOLEAN NOT NULL DEFAULT FALSE,
        reservation_url TEXT,
        reservation_image_url TEXT,
        like_count INTEGER NOT NULL DEFAULT 0,
        stripe_connect_id TEXT,
        stripe_connect_status TEXT DEFAULT 'none',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_owners (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        shop_id INTEGER NOT NULL UNIQUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_services (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        price INTEGER,
        image_url TEXT,
        staff_id INTEGER[],
        requires_prepayment BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_staff (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        role TEXT,
        icon_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_id INTEGER NOT NULL,
        service_id INTEGER,
        staff_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_email TEXT,
        scheduled_at TIMESTAMP NOT NULL,
        status reservation_status NOT NULL DEFAULT 'PENDING',
        reservation_token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        discount TEXT,
        discount_type discount_type NOT NULL DEFAULT 'FREE',
        discount_value INTEGER NOT NULL DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        expiry_date TEXT,
        is_first_time_only BOOLEAN NOT NULL DEFAULT FALSE,
        is_line_account_coupon BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_slots (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_id INTEGER NOT NULL,
        staff_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        time TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(staff_id, day_of_week, time)
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shop_categories (
        shop_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        UNIQUE(shop_id, category_id)
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS service_categories (
        service_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        UNIQUE(service_id, category_id)
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS staff_categories (
        staff_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        UNIQUE(staff_id, category_id)
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        shop_id INTEGER NOT NULL,
        reservation_id INTEGER UNIQUE,
        stripe_payment_id TEXT,
        amount INTEGER NOT NULL,
        status order_status NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("✓ All tables created successfully");

    // Seed initial data
    console.log("Seeding initial data...");

    // Insert areas
    for (const area of schema.AREAS) {
      await db.execute(sql`
        INSERT INTO areas (slug, name, label) 
        VALUES (${area.slug}, ${area.name}, ${area.label})
        ON CONFLICT (slug) DO NOTHING;
      `);
    }
    console.log("✓ Areas seeded");

    // Insert categories
    for (const category of schema.CATEGORIES) {
      await db.execute(sql`
        INSERT INTO categories (slug, name, icon) 
        VALUES (${category.slug}, ${category.name}, ${category.icon})
        ON CONFLICT (slug) DO NOTHING;
      `);
    }
    console.log("✓ Categories seeded");

    console.log("✓ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
