import { AREAS, CATEGORIES } from "@shared/schema";
import type { Shop } from "@shared/schema";

export function getAreaName(areaId: string): string {
  const area = AREAS.find((a) => a.id === areaId);
  return area ? area.name : areaId;
}

export function getAreaLabel(areaId: string): string {
  const area = AREAS.find((a) => a.id === areaId);
  return area ? area.label : areaId;
}

export function getCategoryName(categoryId: string): string {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

export function groupShopsByCategory(shops: Shop[]): Record<string, Shop[]> {
  const grouped: Record<string, Shop[]> = {};
  for (const shop of shops) {
    if (!grouped[shop.category]) {
      grouped[shop.category] = [];
    }
    grouped[shop.category].push(shop);
  }
  return grouped;
}

export function isRecentlyUpdated(updatedAt: string | Date, days: number = 7): boolean {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

export function sortByDisplayOrderAndDate(shops: Shop[]): Shop[] {
  return [...shops].sort((a, b) => {
    if (b.displayOrder !== a.displayOrder) return b.displayOrder - a.displayOrder;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function sortByUpdatedAt(shops: Shop[]): Shop[] {
  return [...shops].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
