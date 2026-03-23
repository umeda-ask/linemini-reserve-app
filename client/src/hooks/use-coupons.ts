import { useState, useEffect, useCallback } from "react";
import type { Coupon } from "@shared/schema";

const STORAGE_KEY = "odekake-acquired-coupons";

export type AcquiredCoupon = Coupon & { acquiredAt: string; shopName: string };

function loadAcquired(): AcquiredCoupon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAcquired(coupons: AcquiredCoupon[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((fn) => fn());
}

export function useCoupons() {
  const [acquired, setAcquired] = useState<AcquiredCoupon[]>(() => loadAcquired());

  useEffect(() => {
    const refresh = () => setAcquired(loadAcquired());
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);

  const acquireCoupon = useCallback((coupon: Coupon, shopName: string) => {
    const current = loadAcquired();
    if (current.some((c) => c.id === coupon.id)) return;
    const next = [...current, { ...coupon, shopName, acquiredAt: new Date().toISOString() }];
    saveAcquired(next);
    setAcquired(next);
    notify();
  }, []);

  const isAcquired = useCallback(
    (couponId: number) => acquired.some((c) => c.id === couponId),
    [acquired]
  );

  const clearAll = useCallback(() => {
    saveAcquired([]);
    setAcquired([]);
    notify();
  }, []);

  return { acquired, acquireCoupon, isAcquired, clearAll };
}
