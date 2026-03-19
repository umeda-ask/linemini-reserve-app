import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shops = pgTable("shops", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  area: text("area").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  hours: text("hours"),
  closedDays: text("closed_days"),
  website: text("website"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  displayOrder: integer("display_order").notNull().default(0),
  lineAccountUrl: text("line_account_url"),
  hasLineAccountCoupon: boolean("has_line_account_coupon").notNull().default(false),
  reservationUrl: text("reservation_url"),
  reservationImageUrl: text("reservation_image_url"),
  galleryImageUrls: text("gallery_image_urls").array(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopId: integer("shop_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discount: text("discount"),
  isLineAccountCoupon: boolean("is_line_account_coupon").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shops).omit({ id: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true });

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

export const AREAS = [
  { id: "odawara", name: "小田原", label: "小田原エリア" },
  { id: "yamato", name: "大和", label: "大和エリア" },
  { id: "hadano", name: "秦野", label: "秦野エリア" },
  { id: "hiratsuka", name: "平塚", label: "平塚エリア" },
  { id: "atsugi", name: "厚木", label: "厚木エリア" },
  { id: "isehara", name: "伊勢原", label: "伊勢原エリア" },
  { id: "ebina", name: "海老名", label: "海老名エリア" },
  { id: "zama", name: "座間", label: "座間エリア" },
  { id: "ayase", name: "綾瀬", label: "綾瀬エリア" },
  { id: "chigasaki", name: "茅ヶ崎", label: "茅ヶ崎エリア" },
  { id: "ninomiya", name: "二宮", label: "二宮エリア" },
  { id: "oiso", name: "大磯", label: "大磯エリア" },
  { id: "minamiashigara", name: "南足柄", label: "南足柄エリア" },
  { id: "kaisei", name: "開成", label: "開成エリア" },
] as const;

export const CATEGORIES = [
  { id: "gourmet", name: "グルメ", icon: "utensils" },
  { id: "beauty", name: "美容・健康", icon: "sparkles" },
  { id: "shopping", name: "ショッピング", icon: "shopping-bag" },
  { id: "leisure", name: "レジャー・体験", icon: "map-pin" },
  { id: "service", name: "サービス", icon: "wrench" },
  { id: "medical", name: "医療・福祉", icon: "heart-pulse" },
] as const;

