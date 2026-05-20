import {
    pgTable, pgEnum, text, integer, serial,
    boolean, timestamp, uniqueIndex
  } from "drizzle-orm/pg-core";
  import { createInsertSchema, createSelectSchema } from "drizzle-zod";
  import { z } from "zod";

  // ─────────────────────────────
  // ユーザー（管理者・店舗管理者）
  // ─────────────────────────────
  export const userRoleEnum = pgEnum("user_role", ["admin", "shop_admin"]);

  export const users = pgTable("users", {
    id:           serial("id").primaryKey(),
    username:     text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role:         userRoleEnum("role").notNull().default("shop_admin"),
    shopId:       integer("shop_id"),
    createdAt:    timestamp("created_at").defaultNow().notNull(),
  });

  export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
  export type InsertUser = z.infer<typeof insertUserSchema>;
  export type User = typeof users.$inferSelect;

  // ─────────────────────────────
  // Enum
  // ─────────────────────────────
  export const discountTypeEnum = pgEnum("discount_type", [
    "AMOUNT", "PERCENTAGE", "FREE"
  ]);

  // ─────────────────────────────
  // エリアマスタ
  // ─────────────────────────────
  export const areas = pgTable("areas", {
    id:        serial("id").primaryKey(),
    slug:      text("slug").notNull().unique(),
    name:      text("name").notNull(),
    label:     text("label").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });

  // ─────────────────────────────
  // カテゴリーマスタ
  // ─────────────────────────────
  export const categories = pgTable("categories", {
    id:        serial("id").primaryKey(),
    slug:      text("slug").notNull().unique(),
    name:      text("name").notNull(),
    icon:      text("icon").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });

  // ─────────────────────────────
  // サブカテゴリーマスタ
  // ─────────────────────────────
  export const subCategories = pgTable("sub_categories", {
    id:          serial("id").primaryKey(),
    category_id: integer("category_id").notNull(),
    slug:        text("slug").notNull().unique(),
    name:        text("name").notNull(),
    icon:        text("icon").notNull(),
    createdAt:   timestamp("created_at").notNull().defaultNow(),
  });

  // ─────────────────────────────
  // 店舗
  // ─────────────────────────────
  export const shops = pgTable("shops", {
    id:                    serial("id").primaryKey(),
    slug:                  text("slug").notNull().unique(),
    name:                  text("name").notNull(),
    description:           text("description").notNull(),
    areaId:                integer("area_id").notNull(),
    area:                  text("area").notNull().default(""),
    category:              text("category").notNull().default(""),
    subcategory:           text("subcategory"),
    address:               text("address").notNull(),
    phone:                 text("phone"),
    hours:                 text("hours"),
    closedDays:            text("closed_days"),
    website:               text("website"),
    displayOrder:          integer("display_order").notNull().default(0),
    lineAccountUrl:        text("line_account_url"),
    imageUrl:              text("image_url").notNull(),
    galleryImageUrls:      text("gallery_image_urls").array(),
    isActive:              boolean("is_active").notNull().default(true),
    enableStaffAssignment: boolean("enable_staff_assignment").notNull().default(false),
    reservationUrl:        text("reservation_url"),
    reservationImageUrl:   text("reservation_image_url"),
    likeCount:             integer("like_count").notNull().default(0),
    stripeConnectId:       text("stripe_connect_id"),
    stripeConnectStatus:   text("stripe_connect_status").default("none"),
    updatedAt:             timestamp("updated_at").notNull().defaultNow(),
    createdAt:             timestamp("created_at").notNull().defaultNow(),
  });

  // ─────────────────────────────
  // クーポン
  // ─────────────────────────────
  export const coupons = pgTable("coupons", {
    id:                   serial("id").primaryKey(),
    shopId:               integer("shop_id").notNull(),
    title:                text("title").notNull(),
    description:          text("description"),
    discount:             text("discount"),
    discountType:         discountTypeEnum("discount_type").notNull().default("FREE"),
    discountValue:        integer("discount_value").notNull().default(0),
    validFrom:            timestamp("valid_from"),
    validUntil:           timestamp("valid_until"),
    expiryDate:           text("expiry_date"),
    isFirstTimeOnly:      boolean("is_first_time_only").notNull().default(false),
    isLineAccountCoupon:  boolean("is_line_account_coupon").notNull().default(false),
    isActive:             boolean("is_active").notNull().default(true),
    createdAt:            timestamp("created_at").notNull().defaultNow(),
    updatedAt:            timestamp("updated_at").notNull().defaultNow(),
  });

  // ─────────────────────────────
  // 中間テーブル（店舗 × カテゴリ）
  // ─────────────────────────────
  export const shopCategories = pgTable("shop_categories", {
    shopId:     integer("shop_id").notNull(),
    categoryId: integer("category_id").notNull(),
  }, (t) => [
    uniqueIndex("shop_categories_idx").on(t.shopId, t.categoryId),
  ]);

  // ─────────────────────────────
  // 予約：スタッフ
  // ─────────────────────────────
  export const bookingStaff = pgTable("booking_staff", {
    id:        serial("id").primaryKey(),
    shopId:    integer("shop_id").notNull(),
    name:      text("name").notNull(),
    role:      text("role").default(""),
    avatar:    text("avatar").default(""),
    isActive:  boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });

  // ─────────────────────────────
  // 予約：コース
  // ─────────────────────────────
  export const bookingCourses = pgTable("booking_courses", {
    id:                serial("id").primaryKey(),
    shopId:            integer("shop_id").notNull(),
    name:              text("name").notNull(),
    duration:          integer("duration").default(60),
    price:             integer("price").default(0),
    description:       text("description").default(""),
    prepaymentOnly:    boolean("prepayment_only").default(false),
    enableRequestMode: boolean("enable_request_mode").default(false),
    imageUrl:          text("image_url"),
    staffIds:          text("staff_ids").array().default([]),
    isActive:          boolean("is_active").default(true),
    createdAt:         timestamp("created_at").defaultNow(),
    updatedAt:         timestamp("updated_at").defaultNow(),
  });

  // ─────────────────────────────
  // 予約：予約データ
  // ─────────────────────────────
  export const bookingReservations = pgTable("booking_reservations", {
    id:                    serial("id").primaryKey(),
    shopId:                integer("shop_id").notNull(),
    customerName:          text("customer_name").notNull(),
    customerPhone:         text("customer_phone"),
    customerEmail:         text("customer_email"),
    customerNote:          text("customer_note"),
    customerCount:         integer("customer_count").default(1),
    date:                  text("date"),
    time:                  text("time"),
    staffId:               text("staff_id").default("__shop__"),
    courseId:              text("course_id").notNull(),
    status:                text("status").default("confirmed"),
    paid:                  boolean("paid").default(false),
    cancelToken:           text("cancel_token"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt:             timestamp("created_at").defaultNow(),
    updatedAt:             timestamp("updated_at").defaultNow(),
  }, (t) => [
    uniqueIndex("booking_reservations_cancel_token_idx").on(t.cancelToken),
  ]);

  // ─────────────────────────────
  // 予約：店舗設定
  // ─────────────────────────────
  export const bookingSettings = pgTable("booking_settings", {
    shopId:               integer("shop_id").primaryKey(),
    storeName:            text("store_name").default(""),
    storeDescription:     text("store_description").default(""),
    storeAddress:         text("store_address").default(""),
    storePhone:           text("store_phone").default(""),
    storeEmail:           text("store_email").default(""),
    storeHours:           text("store_hours").default(""),
    storeClosedDays:      text("store_closed_days").default(""),
    bannerUrl:            text("banner_url").default(""),
    staffSelectionEnabled:boolean("staff_selection_enabled").notNull().default(false),
    tableCount:           integer("table_count").default(0),
    cancelLimitDays:      integer("cancel_limit_days").default(1),
    maxPartySize:         integer("max_party_size").default(0),
    storeOpenTime:        text("store_open_time").default("10:00"),
    storeCloseTime:       text("store_close_time").default("19:00"),
    createdAt:            timestamp("created_at").defaultNow(),
    updatedAt:            timestamp("updated_at").defaultNow(),
  });

  // ─────────────────────────────
  // メニュー
  // ─────────────────────────────
  export const shopMenuItems = pgTable("shop_menu_items", {
    id:           serial("id").primaryKey(),
    shopId:       integer("shop_id").notNull(),
    name:         text("name").notNull(),
    price:        integer("price").notNull().default(0),
    comment:      text("comment").notNull().default(""),
    imageUrl:     text("image_url"),
    isVisible:    boolean("is_visible").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt:    timestamp("created_at").notNull().defaultNow(),
    updatedAt:    timestamp("updated_at").defaultNow(),
  });
  export type InsertShopMenuItem = typeof shopMenuItems.$inferInsert;
  export type ShopMenuItem       = typeof shopMenuItems.$inferSelect;

  // ─────────────────────────────
  // 予約：スロット
  // ─────────────────────────────
  export const bookingSlots = pgTable("booking_slots", {
    id:         serial("id").primaryKey(),
    shopId:     integer("shop_id").notNull(),
    staffId:    text("staff_id").notNull(),
    dayOfWeek:  integer("day_of_week").notNull(),
    time:       text("time").notNull(),
    available:  boolean("available").notNull().default(true),
    updatedAt:  timestamp("updated_at").defaultNow(),
  }, (t) => [
    uniqueIndex("booking_slots_idx").on(t.shopId, t.staffId, t.dayOfWeek, t.time),
  ]);
  