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
  subcategory: text("subcategory"),
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
  stripeConnectId: text("stripe_connect_id"),
  stripeConnectStatus: text("stripe_connect_status").default("none"),
});

export const coupons = pgTable("coupons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopId: integer("shop_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discount: text("discount"),
  expiryDate: text("expiry_date"),
  isFirstTimeOnly: boolean("is_first_time_only").notNull().default(false),
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
  { id: "kawasaki",       name: "川崎",   label: "川崎エリア" },
  { id: "yokohama",       name: "横浜",   label: "横浜エリア" },
  { id: "sagamihara",     name: "相模原", label: "相模原エリア" },
  { id: "yamato",         name: "大和",   label: "大和エリア" },
  { id: "zama",           name: "座間",   label: "座間エリア" },
  { id: "ebina",          name: "海老名", label: "海老名エリア" },
  { id: "ayase",          name: "綾瀬",   label: "綾瀬エリア" },
  { id: "atsugi",         name: "厚木",   label: "厚木エリア" },
  { id: "isehara",        name: "伊勢原", label: "伊勢原エリア" },
  { id: "hadano",         name: "秦野",   label: "秦野エリア" },
  { id: "samukawa",       name: "寒川",   label: "寒川エリア" },
  { id: "hiratsuka",      name: "平塚",   label: "平塚エリア" },
  { id: "chigasaki",      name: "茅ヶ崎", label: "茅ヶ崎エリア" },
  { id: "kamakura",       name: "鎌倉",   label: "鎌倉エリア" },
  { id: "yokosuka",       name: "横須賀", label: "横須賀エリア" },
  { id: "zushi",          name: "逗子",   label: "逗子エリア" },
  { id: "miura",          name: "三浦",   label: "三浦エリア" },
  { id: "hayama",         name: "葉山",   label: "葉山エリア" },
  { id: "ninomiya",       name: "二宮",   label: "二宮エリア" },
  { id: "oiso",           name: "大磯",   label: "大磯エリア" },
  { id: "odawara",        name: "小田原", label: "小田原エリア" },
  { id: "minamiashigara", name: "南足柄", label: "南足柄エリア" },
  { id: "kaisei",         name: "開成",   label: "開成エリア" },
  { id: "matsuda",        name: "松田",   label: "松田エリア" },
  { id: "yamakita",       name: "山北",   label: "山北エリア" },
  { id: "hakone",         name: "箱根",   label: "箱根エリア" },
  { id: "manazuru",       name: "真鶴",   label: "真鶴エリア" },
  { id: "yugawara",       name: "湯河原", label: "湯河原エリア" },
  { id: "gotemba",        name: "御殿場", label: "御殿場エリア（静岡）" },
  { id: "atami",          name: "熱海",   label: "熱海エリア（静岡）" },
] as const;

export const CATEGORIES = [
  { id: "gourmet",   name: "グルメ",       icon: "utensils" },
  { id: "beauty",    name: "美容・健康",   icon: "sparkles" },
  { id: "shopping",  name: "ショッピング", icon: "shopping-bag" },
  { id: "leisure",   name: "レジャー・体験", icon: "map-pin" },
  { id: "service",   name: "サービス",     icon: "wrench" },
  { id: "medical",   name: "医療・福祉",   icon: "heart-pulse" },
] as const;

export const SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  gourmet: [
    { id: "washoku",   name: "和食" },
    { id: "yoshoku",   name: "洋食" },
    { id: "chuka",     name: "中華" },
    { id: "italian",   name: "イタリアン" },
    { id: "izakaya",   name: "居酒屋" },
    { id: "cafe",      name: "カフェ" },
    { id: "ramen",     name: "ラーメン" },
    { id: "sushi",     name: "寿司・海鮮" },
    { id: "sweets",    name: "スイーツ" },
    { id: "other",     name: "その他" },
  ],
  beauty: [
    { id: "hair",      name: "ヘアサロン" },
    { id: "esthe",     name: "エステ" },
    { id: "nail",      name: "ネイル" },
    { id: "massage",   name: "マッサージ・整体" },
    { id: "fitness",   name: "フィットネス" },
    { id: "other",     name: "その他" },
  ],
  shopping: [
    { id: "fashion",     name: "ファッション" },
    { id: "goods",       name: "雑貨" },
    { id: "food",        name: "食料品・惣菜" },
    { id: "electronics", name: "家電・デジタル" },
    { id: "books",       name: "書籍・文具" },
    { id: "other",       name: "その他" },
  ],
  leisure: [
    { id: "sightseeing",   name: "観光スポット" },
    { id: "onsen",         name: "温泉・スパ" },
    { id: "outdoor",       name: "アウトドア" },
    { id: "experience",    name: "体験・教室" },
    { id: "entertainment", name: "エンタメ" },
    { id: "other",         name: "その他" },
  ],
  service: [
    { id: "cleaning",   name: "クリーニング" },
    { id: "repair",     name: "修理・メンテナンス" },
    { id: "school",     name: "教室・スクール" },
    { id: "realestate", name: "不動産" },
    { id: "other",      name: "その他" },
  ],
  medical: [
    { id: "clinic",    name: "病院・クリニック" },
    { id: "dental",    name: "歯科" },
    { id: "pharmacy",  name: "調剤薬局" },
    { id: "care",      name: "介護・福祉" },
    { id: "other",     name: "その他" },
  ],
};
