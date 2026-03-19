import { randomBytes } from "crypto";

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  courseIds: string[];
}

export interface Course {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  prepaymentOnly: boolean;
  imageUrl: string | null;
  staffIds: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  time: string;
  staffId: string;
  courseId: string;
  status: "confirmed" | "pending" | "cancelled";
  paid: boolean;
  cancelToken?: string;
}

interface SlotEntry {
  id: string;
  staffId: string;
  dayOfWeek: number;
  time: string;
  available: boolean;
}

interface Inquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

interface ShopBookingData {
  staff: Staff[];
  courses: Course[];
  reservations: Reservation[];
  settings: Record<string, string>;
}

const SHOP_BOOKING_DATA: Record<number, ShopBookingData> = {
  1: {
    staff: [
      { id: "s1-1", name: "佐藤 健太", role: "料理長", avatar: "佐健", courseIds: ["c1-1", "c1-2"] },
      { id: "s1-2", name: "高橋 裕子", role: "副料理長", avatar: "高裕", courseIds: ["c1-1", "c1-3"] },
    ],
    courses: [
      { id: "c1-1", name: "特製ラーメンコース", category: "食事", duration: 60, price: 2800, description: "自家製麺と特製スープの極上ラーメンコース。前菜・餃子・デザート付き。", prepaymentOnly: false, imageUrl: null, staffIds: ["s1-1", "s1-2"] },
      { id: "c1-2", name: "宴会プラン（2時間）", category: "宴会", duration: 120, price: 4500, description: "飲み放題付き宴会プラン。ラーメン・チャーハン・餃子など全8品。", prepaymentOnly: true, imageUrl: null, staffIds: ["s1-1"] },
      { id: "c1-3", name: "ランチセット予約", category: "食事", duration: 45, price: 1200, description: "日替わりラーメン＋ミニチャーハン＋ドリンクのお得なランチセット。", prepaymentOnly: false, imageUrl: null, staffIds: ["s1-2"] },
    ],
    reservations: [
      { id: "r1-1", customerName: "田中 太郎", date: "2026-03-10", time: "12:00", staffId: "s1-1", courseId: "c1-1", status: "confirmed", paid: true },
      { id: "r1-2", customerName: "山田 花子", date: "2026-03-10", time: "18:00", staffId: "s1-1", courseId: "c1-2", status: "pending", paid: false },
    ],
    settings: {
      store_name: "麺処 小田原屋",
      store_description: "自家製麺と厳選スープのこだわりラーメン店",
      store_address: "神奈川県小田原市栄町2-1-5",
      store_phone: "0465-22-1234",
      store_email: "info@odawaraya.jp",
      store_hours: "11:00〜22:00（L.O. 21:30）",
      store_closed_days: "毎週水曜日",
      banner_url: "",
      staff_selection_enabled: "false",
    },
  },
  3: {
    staff: [
      { id: "s3-1", name: "田中 美咲", role: "オーナースタイリスト", avatar: "田美", courseIds: ["c3-1", "c3-2", "c3-3", "c3-4"] },
      { id: "s3-2", name: "佐藤 優花", role: "シニアスタイリスト", avatar: "佐優", courseIds: ["c3-1", "c3-2", "c3-3"] },
      { id: "s3-3", name: "山本 凛", role: "スタイリスト", avatar: "山凛", courseIds: ["c3-1", "c3-2"] },
      { id: "s3-4", name: "鈴木 愛", role: "ジュニアスタイリスト", avatar: "鈴愛", courseIds: ["c3-1"] },
    ],
    courses: [
      { id: "c3-1", name: "カット", category: "ヘア", duration: 60, price: 4400, description: "カウンセリング・シャンプー・カット・ブロー込みのスタンダードメニュー。", prepaymentOnly: false, imageUrl: null, staffIds: ["s3-1", "s3-2", "s3-3", "s3-4"] },
      { id: "c3-2", name: "カット＋カラー", category: "ヘア", duration: 120, price: 9800, description: "カットとカラーのセットメニュー。オーガニックカラー使用。", prepaymentOnly: false, imageUrl: null, staffIds: ["s3-1", "s3-2", "s3-3"] },
      { id: "c3-3", name: "カット＋パーマ", category: "ヘア", duration: 150, price: 13200, description: "カットとパーマのセットメニュー。デジタルパーマも対応。", prepaymentOnly: false, imageUrl: null, staffIds: ["s3-1", "s3-2"] },
      { id: "c3-4", name: "ヘッドスパ", category: "リラクゼーション", duration: 45, price: 5500, description: "頭皮ケア＆リラクゼーション。炭酸泉使用。", prepaymentOnly: false, imageUrl: null, staffIds: ["s3-1"] },
    ],
    reservations: [
      { id: "r3-1", customerName: "高橋 花子", date: "2026-03-10", time: "10:00", staffId: "s3-1", courseId: "c3-1", status: "confirmed", paid: true },
      { id: "r3-2", customerName: "伊藤 明美", date: "2026-03-10", time: "11:30", staffId: "s3-2", courseId: "c3-2", status: "confirmed", paid: true },
      { id: "r3-3", customerName: "渡辺 美穂", date: "2026-03-10", time: "14:00", staffId: "s3-1", courseId: "c3-4", status: "pending", paid: false },
      { id: "r3-4", customerName: "中村 さくら", date: "2026-03-11", time: "10:00", staffId: "s3-3", courseId: "c3-1", status: "confirmed", paid: false },
    ],
    settings: {
      store_name: "Hair Salon MIKU",
      store_description: "あなたの魅力を引き出すヘアサロン",
      store_address: "神奈川県大和市中央3-5-8",
      store_phone: "046-261-3456",
      store_email: "info@salon-miku.jp",
      store_hours: "10:00〜20:00（最終受付19:00）",
      store_closed_days: "毎週火曜日",
      banner_url: "",
      staff_selection_enabled: "true",
    },
  },
  6: {
    staff: [
      { id: "s6-1", name: "小林 大将", role: "大将（板前）", avatar: "小大", courseIds: ["c6-1", "c6-2", "c6-3"] },
      { id: "s6-2", name: "加藤 職人", role: "二番手", avatar: "加職", courseIds: ["c6-1", "c6-2"] },
    ],
    courses: [
      { id: "c6-1", name: "おまかせ握りコース", category: "寿司", duration: 90, price: 8800, description: "旬のネタを大将が厳選。握り10貫＋お椀＋デザート。", prepaymentOnly: true, imageUrl: null, staffIds: ["s6-1", "s6-2"] },
      { id: "c6-2", name: "特上握りコース", category: "寿司", duration: 120, price: 15800, description: "最高級ネタの特上握り15貫＋前菜3種＋お椀＋デザート。", prepaymentOnly: true, imageUrl: null, staffIds: ["s6-1", "s6-2"] },
      { id: "c6-3", name: "カウンター席予約", category: "席予約", duration: 60, price: 0, description: "カウンター席の予約。お料理は当日注文。", prepaymentOnly: false, imageUrl: null, staffIds: ["s6-1"] },
    ],
    reservations: [
      { id: "r6-1", customerName: "木村 一郎", date: "2026-03-10", time: "18:00", staffId: "s6-1", courseId: "c6-1", status: "confirmed", paid: true },
      { id: "r6-2", customerName: "松本 恵子", date: "2026-03-11", time: "12:00", staffId: "s6-2", courseId: "c6-2", status: "pending", paid: false },
    ],
    settings: {
      store_name: "鮨処 匠",
      store_description: "小田原の新鮮な魚介を職人技で握る本格寿司店",
      store_address: "神奈川県小田原市本町1-8-12",
      store_phone: "0465-34-5678",
      store_email: "info@sushi-takumi.jp",
      store_hours: "11:30〜14:00 / 17:00〜22:00",
      store_closed_days: "毎週月曜日",
      banner_url: "",
      staff_selection_enabled: "true",
    },
  },
};

class BookingStore {
  staff: Staff[];
  courses: Course[];
  reservations: Reservation[];
  settings: Record<string, string>;
  inquiries: Inquiry[] = [];
  slots: SlotEntry[] = [];
  private nextId = 100;

  constructor(data: ShopBookingData) {
    this.staff = JSON.parse(JSON.stringify(data.staff));
    this.courses = JSON.parse(JSON.stringify(data.courses));
    this.reservations = JSON.parse(JSON.stringify(data.reservations));
    this.settings = { ...data.settings };
  }

  genId() {
    return String(this.nextId++);
  }

  genToken() {
    return randomBytes(32).toString("hex");
  }

  getTimeSlots(staffId: string, date: string): TimeSlot[] {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const customSlots = this.slots.filter(
      (s) => s.staffId === staffId && s.dayOfWeek === dayOfWeek
    );
    const bookedTimes = this.reservations
      .filter(
        (r) =>
          r.date === date && r.staffId === staffId && r.status !== "cancelled"
      )
      .map((r) => r.time);

    if (customSlots.length > 0) {
      return customSlots
        .map((s) => ({
          time: s.time,
          available: s.available && !bookedTimes.includes(s.time),
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
    }

    const slots: TimeSlot[] = [];
    for (let h = 10; h <= 19; h++) {
      for (const m of ["00", "30"]) {
        if (h === 19 && m === "30") continue;
        const time = `${h}:${m}`;
        slots.push({ time, available: !bookedTimes.includes(time) });
      }
    }
    return slots;
  }

  getStaffSlots(staffId: string): SlotEntry[] {
    return this.slots.filter((s) => s.staffId === staffId);
  }
}

class BookingStoreManager {
  private stores = new Map<number, BookingStore>();

  getStore(shopId: number): BookingStore | undefined {
    if (!this.stores.has(shopId)) {
      const data = SHOP_BOOKING_DATA[shopId];
      if (!data) return undefined;
      this.stores.set(shopId, new BookingStore(data));
    }
    return this.stores.get(shopId);
  }

  getShopIdsWithBooking(): number[] {
    return Object.keys(SHOP_BOOKING_DATA).map(Number);
  }
}

export const bookingManager = new BookingStoreManager();

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}
