import { type Shop, type InsertShop, type Coupon, type InsertCoupon, shops, coupons } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getShops(): Promise<Shop[]>;
  getShopById(id: number): Promise<Shop | undefined>;
  getShopsByArea(area: string): Promise<Shop[]>;
  getShopsByCategory(category: string): Promise<Shop[]>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: number, data: Partial<InsertShop>): Promise<Shop | undefined>;
  getCouponsByShopId(shopId: number): Promise<Coupon[]>;
  getAllCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getShops(): Promise<Shop[]> {
    return db.select().from(shops).orderBy(desc(shops.displayOrder), desc(shops.updatedAt));
  }

  async getShopById(id: number): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
    return shop;
  }

  async getShopsByArea(area: string): Promise<Shop[]> {
    return db.select().from(shops).where(eq(shops.area, area)).orderBy(desc(shops.displayOrder), desc(shops.updatedAt));
  }

  async getShopsByCategory(category: string): Promise<Shop[]> {
    return db.select().from(shops).where(eq(shops.category, category)).orderBy(desc(shops.displayOrder), desc(shops.updatedAt));
  }

  async createShop(insertShop: InsertShop): Promise<Shop> {
    const [shop] = await db.insert(shops).values(insertShop).returning();
    return shop;
  }

  async updateShop(id: number, data: Partial<InsertShop>): Promise<Shop | undefined> {
    const [shop] = await db.update(shops).set({ ...data, updatedAt: new Date() }).where(eq(shops.id, id)).returning();
    return shop;
  }

  async getCouponsByShopId(shopId: number): Promise<Coupon[]> {
    return db.select().from(coupons).where(eq(coupons.shopId, shopId)).orderBy(desc(coupons.updatedAt));
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.updatedAt));
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values(coupon).returning();
    return created;
  }

  async updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updated] = await db.update(coupons).set({ ...data, updatedAt: new Date() }).where(eq(coupons.id, id)).returning();
    return updated;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
