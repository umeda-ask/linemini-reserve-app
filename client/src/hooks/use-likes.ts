import { useState, useCallback, useEffect } from "react";

const LIKED_KEY = "odekake-liked-shops";
const COUNTS_KEY = "odekake-like-counts";

function seedCount(shopId: number): number {
  return 30 + ((shopId * 37 + shopId * shopId * 7) % 120);
}

function loadLiked(): number[] {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

function loadCounts(): Record<number, number> {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveLiked(ids: number[]) {
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
}

function saveCounts(counts: Record<number, number>) {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}
export function useLikes(shopId: number, initialCount: number) {
  const [liked, setLiked] = useState<boolean>(() => loadLiked().includes(shopId));
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    setCount(initialCount);
    setLiked(loadLiked().includes(shopId));

    const sync = () => {
      setLiked(loadLiked().includes(shopId));
      const updatedCounts = loadCounts();
      if (updatedCounts[shopId] !== undefined) {
        setCount(updatedCounts[shopId]);
      }
    };
    
    listeners.add(sync);
    return () => { 
      listeners.delete(sync); 
    };
  }, [shopId, initialCount]);

  const like = useCallback(async () => {
    const currentLiked = loadLiked();
    if (currentLiked.includes(shopId)) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json(); 

        // 画面の状態を更新
        setLiked(true);
        setCount(data.likeCount);
        const nextLiked = [...currentLiked, shopId];
        saveLiked(nextLiked);

        const counts = loadCounts();
        counts[shopId] = data.likeCount;
        saveCounts(counts);

        notify();
      }
    } catch (error) {
      console.error("いいね送信に失敗しました:", error);
    }
  }, [shopId]);

  return { liked, count, like };
}
