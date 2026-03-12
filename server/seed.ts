import { db } from "./db";
import { eq } from "drizzle-orm";
import { shops, coupons } from "@shared/schema";

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const seedShops = [
  {
    name: "麺処 小田原屋",
    description: "地元で愛され続けて30年。自家製麺と豚骨魚介スープが自慢のラーメン店。小田原の新鮮な魚介を使った特製つけ麺も人気です。",
    area: "odawara",
    category: "gourmet",
    imageUrl: "/images/shop-ramen.png",
    address: "神奈川県小田原市栄町2-1-5",
    phone: "0465-22-xxxx",
    hours: "11:00〜21:00",
    closedDays: "毎週火曜日",
    website: "https://example.com",
    latitude: "35.2564",
    longitude: "139.1554",
    displayOrder: 10,
    lineAccountUrl: "https://line.me/R/ti/p/@odawaraya",
    hasLineAccountCoupon: true,
    reservationUrl: "/app/reservation/1",
    galleryImageUrls: ["/images/shop-ramen.png", "/images/shop-izakaya.png", "/images/shop-cafe.png"],
    updatedAt: daysAgo(1),
  },
  {
    name: "Boulangerie Soleil",
    description: "フランスで修行したシェフが焼き上げる本格パン。毎朝焼きたてのクロワッサンとバゲットが人気。季節限定のデニッシュも見逃せません。",
    area: "yamato",
    category: "gourmet",
    imageUrl: "/images/shop-bakery.png",
    address: "神奈川県大和市中央2-3-10",
    phone: "046-260-xxxx",
    hours: "7:00〜18:00",
    closedDays: "毎週月曜日・火曜日",
    latitude: "35.4718",
    longitude: "139.4621",
    displayOrder: 5,
    galleryImageUrls: ["/images/shop-bakery.png", "/images/shop-cafe.png", "/images/shop-flower.png"],
    updatedAt: daysAgo(3),
  },
  {
    name: "Hair Salon MIKU",
    description: "大和駅徒歩3分。経験豊富なスタイリストが、あなたの魅力を引き出すヘアスタイルをご提案。カラーやパーマも得意です。",
    area: "yamato",
    category: "beauty",
    imageUrl: "/images/shop-salon.png",
    address: "神奈川県大和市大和南1-5-2",
    phone: "046-261-xxxx",
    hours: "10:00〜20:00",
    closedDays: "毎週水曜日",
    website: "https://example.com",
    latitude: "35.4682",
    longitude: "139.4603",
    displayOrder: 8,
    lineAccountUrl: "https://line.me/R/ti/p/@miku-salon",
    hasLineAccountCoupon: true,
    reservationUrl: "/app/reservation/3",
    galleryImageUrls: ["/images/shop-salon.png", "/images/shop-spa.png", "/images/shop-flower.png"],
    updatedAt: daysAgo(2),
  },
  {
    name: "居酒屋 海の幸",
    description: "小田原漁港直送の新鮮な魚介を楽しめる居酒屋。刺身盛り合わせや地魚の煮付けが名物。日本酒の品揃えも豊富です。",
    area: "odawara",
    category: "gourmet",
    imageUrl: "/images/shop-izakaya.png",
    address: "神奈川県小田原市本町3-7-1",
    phone: "0465-24-xxxx",
    hours: "17:00〜23:00",
    closedDays: "毎週日曜日",
    latitude: "35.2551",
    longitude: "139.1547",
    displayOrder: 7,
    galleryImageUrls: ["/images/shop-izakaya.png", "/images/shop-sushi.png", "/images/shop-cafe.png"],
    updatedAt: daysAgo(5),
  },
  {
    name: "Cafe Komorebi",
    description: "緑に囲まれた癒しのカフェ。自家焙煎コーヒーとハンドメイドスイーツでゆったりとしたひとときを。Wi-Fi完備でテレワークにも。",
    area: "hadano",
    category: "gourmet",
    imageUrl: "/images/shop-cafe.png",
    address: "神奈川県秦野市曲松1-2-8",
    phone: "0463-81-xxxx",
    hours: "9:00〜18:00",
    closedDays: "毎週木曜日",
    latitude: "35.3739",
    longitude: "139.2274",
    displayOrder: 3,
    updatedAt: daysAgo(10),
  },
  {
    name: "鮨処 匠",
    description: "カウンター8席のみの本格江戸前鮨。大将が一貫一貫丁寧に握ります。ランチのおまかせ握りセットは予約必須の人気メニュー。",
    area: "hiratsuka",
    category: "gourmet",
    imageUrl: "/images/shop-sushi.png",
    address: "神奈川県平塚市紅谷町5-3-2",
    phone: "0463-21-xxxx",
    hours: "11:30〜14:00 / 17:00〜22:00",
    closedDays: "毎週月曜日",
    latitude: "35.3290",
    longitude: "139.3492",
    displayOrder: 9,
    lineAccountUrl: "https://line.me/R/ti/p/@sushi-takumi",
    hasLineAccountCoupon: true,
    reservationUrl: "/app/reservation/6",
    galleryImageUrls: ["/images/shop-sushi.png", "/images/shop-izakaya.png", "/images/shop-ramen.png"],
    updatedAt: daysAgo(0),
  },
  {
    name: "リラクゼーション 和の庵",
    description: "日頃の疲れを癒す和のリラクゼーションサロン。アロマオイルを使った全身マッサージや足つぼが人気。完全予約制で落ち着いた空間。",
    area: "atsugi",
    category: "beauty",
    imageUrl: "/images/shop-spa.png",
    address: "神奈川県厚木市中町2-6-15",
    phone: "046-225-xxxx",
    hours: "10:00〜21:00",
    closedDays: "不定休",
    latitude: "35.4432",
    longitude: "139.3653",
    displayOrder: 6,
    galleryImageUrls: ["/images/shop-spa.png", "/images/shop-salon.png", "/images/shop-gym.png"],
    updatedAt: daysAgo(4),
  },
  {
    name: "フィットネスジム POWER",
    description: "最新マシン完備のフィットネスジム。パーソナルトレーニングや各種スタジオプログラムも充実。初心者から上級者まで対応。",
    area: "isehara",
    category: "leisure",
    imageUrl: "/images/shop-gym.png",
    address: "神奈川県伊勢原市板戸1-8-3",
    phone: "0463-94-xxxx",
    hours: "6:00〜23:00",
    closedDays: "年中無休",
    latitude: "35.3967",
    longitude: "139.3142",
    displayOrder: 4,
    updatedAt: daysAgo(6),
  },
  {
    name: "フラワーショップ 花音",
    description: "季節の花々を取り揃えたフラワーショップ。アレンジメントやブーケのオーダーも承ります。ギフトラッピングも無料。",
    area: "yamato",
    category: "shopping",
    imageUrl: "/images/shop-flower.png",
    address: "神奈川県大和市鶴間1-4-7",
    phone: "046-274-xxxx",
    hours: "9:30〜19:00",
    closedDays: "毎週水曜日",
    latitude: "35.4827",
    longitude: "139.4587",
    displayOrder: 2,
    updatedAt: daysAgo(8),
  },
  {
    name: "小田原城下 甘味処 桜",
    description: "小田原城のそばにある和菓子カフェ。手作りのわらび餅やあんみつが人気。抹茶セットで小田原散策の休憩にぴったり。",
    area: "odawara",
    category: "gourmet",
    imageUrl: "/images/shop-cafe.png",
    address: "神奈川県小田原市城内4-2-1",
    phone: "0465-23-xxxx",
    hours: "10:00〜17:00",
    closedDays: "毎週火曜日",
    latitude: "35.2508",
    longitude: "139.1531",
    displayOrder: 5,
    galleryImageUrls: ["/images/shop-cafe.png", "/images/shop-bakery.png", "/images/shop-flower.png"],
    updatedAt: daysAgo(2),
  },
  {
    name: "整体院 からだ工房",
    description: "骨盤矯正と姿勢改善の専門院。肩こり・腰痛・頭痛でお悩みの方に。丁寧なカウンセリングと施術で根本改善を目指します。",
    area: "hadano",
    category: "medical",
    imageUrl: "/images/shop-spa.png",
    address: "神奈川県秦野市大秦町3-5-12",
    phone: "0463-83-xxxx",
    hours: "9:00〜20:00",
    closedDays: "毎週日曜日・祝日",
    latitude: "35.3756",
    longitude: "139.2298",
    displayOrder: 4,
    updatedAt: daysAgo(3),
  },
  {
    name: "パソコン修理 テクノサポート",
    description: "パソコンやスマホのトラブルならお任せ。データ復旧、液晶交換、ウイルス駆除など幅広く対応。出張サービスも行っています。",
    area: "hiratsuka",
    category: "service",
    imageUrl: "/images/shop-gym.png",
    address: "神奈川県平塚市宝町8-1-6",
    phone: "0463-35-xxxx",
    hours: "10:00〜19:00",
    closedDays: "毎週日曜日",
    latitude: "35.3312",
    longitude: "139.3478",
    displayOrder: 1,
    updatedAt: daysAgo(14),
  },
  {
    name: "海老名ベーカリー ブレッドガーデン",
    description: "海老名駅直結のベーカリー。天然酵母を使用したこだわりのパンが50種類以上。イートインスペースもあり。",
    area: "ebina",
    category: "gourmet",
    imageUrl: "/images/shop-bakery.png",
    address: "神奈川県海老名市中央1-1-1",
    phone: "046-234-xxxx",
    hours: "8:00〜20:00",
    closedDays: "年中無休",
    latitude: "35.4472",
    longitude: "139.3909",
    displayOrder: 6,
    updatedAt: daysAgo(1),
  },
  {
    name: "茅ヶ崎サーフショップ WAVE",
    description: "サーフボードやウェットスーツの販売・レンタル。初心者向けサーフィンスクールも開催。海好きが集まるお店です。",
    area: "chigasaki",
    category: "leisure",
    imageUrl: "/images/shop-gym.png",
    address: "神奈川県茅ヶ崎市東海岸南3-2-5",
    phone: "0467-82-xxxx",
    hours: "9:00〜19:00",
    closedDays: "毎週火曜日",
    latitude: "35.3242",
    longitude: "139.4039",
    displayOrder: 5,
    updatedAt: daysAgo(4),
  },
];

const seedCoupons = [
  {
    shopId: 1,
    title: "ラーメン全品100円引き",
    description: "クーポン提示でラーメン全品が100円引きになります。他の割引との併用はできません。",
    discount: "100円OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(1),
  },
  {
    shopId: 1,
    title: "LINE公式アカウント限定トッピング無料",
    description: "LINE公式アカウントを友だち追加で、お好きなトッピングを1つ無料サービス。",
    discount: "トッピング無料",
    isLineAccountCoupon: true,
    updatedAt: daysAgo(1),
  },
  {
    shopId: 2,
    title: "お買い上げ500円以上でミニパンプレゼント",
    description: "500円以上お買い上げでお好きなミニパンを1つプレゼント。",
    discount: "ミニパン1個無料",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(3),
  },
  {
    shopId: 3,
    title: "初回カット20%OFF",
    description: "初めてのご来店のお客様限定。カット施術が20%OFFになります。予約時にクーポン利用をお伝えください。",
    discount: "カット20%OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(2),
  },
  {
    shopId: 3,
    title: "LINE友だち限定ヘッドスパ無料",
    description: "LINE公式アカウントを友だち追加で、カット時にヘッドスパを無料サービス。",
    discount: "ヘッドスパ無料",
    isLineAccountCoupon: true,
    updatedAt: daysAgo(2),
  },
  {
    shopId: 4,
    title: "お会計10%OFF",
    description: "4名様以上のグループでのご利用も可能です。",
    discount: "10%OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(5),
  },
  {
    shopId: 6,
    title: "ランチセット1品サービス",
    description: "ランチタイムにおまかせセットをご注文のお客様に、小鉢を1品サービス。",
    discount: "小鉢1品無料",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(0),
  },
  {
    shopId: 6,
    title: "LINE限定 握り1貫サービス",
    description: "LINE公式アカウント友だち追加で、お好きな握りを1貫サービス。",
    discount: "握り1貫無料",
    isLineAccountCoupon: true,
    updatedAt: daysAgo(0),
  },
  {
    shopId: 7,
    title: "60分コース500円引き",
    description: "全身リラクゼーション60分以上のコースが500円引きになります。初回・リピーターともに利用可能。",
    discount: "500円OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(4),
  },
  {
    shopId: 8,
    title: "体験利用無料",
    description: "通常1,100円の体験利用が無料！マシンエリアとスタジオプログラムをお試しいただけます。",
    discount: "体験無料",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(6),
  },
  {
    shopId: 10,
    title: "抹茶セット100円引き",
    description: "人気の抹茶セット（抹茶＋季節の和菓子）が100円引きになります。",
    discount: "100円OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(2),
  },
  {
    shopId: 11,
    title: "初回施術料30%OFF",
    description: "初めての方限定。全メニューの施術料が30%OFFになります。",
    discount: "初回30%OFF",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(3),
  },
  {
    shopId: 13,
    title: "食パン1斤プレゼント",
    description: "1,000円以上のお買い上げで当店自慢の食パン1斤をプレゼント。",
    discount: "食パン1斤無料",
    isLineAccountCoupon: false,
    updatedAt: daysAgo(1),
  },
];

export async function seedDatabase() {
  const existingShops = await db.select().from(shops);
  if (existingShops.length === 0) {
    console.log("Seeding shops...");
    for (const shop of seedShops) {
      await db.insert(shops).values(shop);
    }
    console.log(`Seeded ${seedShops.length} shops`);
  } else {
    console.log(`Shops already exist (${existingShops.length}), checking settings...`);
    for (const s of existingShops) {
      if (s.reservationUrl && !s.reservationUrl.startsWith("/app/")) {
        const fixed = `/app${s.reservationUrl}`;
        await db.update(shops).set({ reservationUrl: fixed }).where(eq(shops.id, s.id));
        console.log(`Fixed reservationUrl for shop ${s.id}: ${s.reservationUrl} -> ${fixed}`);
      }
      const seedShop = seedShops.find(ss => ss.name === s.name);
      if (seedShop && (seedShop as any).galleryImageUrls && (!s.galleryImageUrls || s.galleryImageUrls.length === 0)) {
        await db.update(shops).set({ galleryImageUrls: (seedShop as any).galleryImageUrls }).where(eq(shops.id, s.id));
        console.log(`Set galleryImageUrls for shop ${s.id}`);
      }
    }
    const needsUpdate = existingShops.every(s => s.displayOrder === 0 && !s.reservationUrl && !s.lineAccountUrl);
    if (needsUpdate) {
      console.log("Shop settings are default, restoring seed settings...");
      for (const seedShop of seedShops) {
        const existing = existingShops.find(s => s.name === seedShop.name);
        if (existing) {
          await db.update(shops).set({
            displayOrder: seedShop.displayOrder,
            lineAccountUrl: seedShop.lineAccountUrl || null,
            hasLineAccountCoupon: seedShop.hasLineAccountCoupon || false,
            reservationUrl: seedShop.reservationUrl || null,
            updatedAt: seedShop.updatedAt,
            latitude: seedShop.latitude || null,
            longitude: seedShop.longitude || null,
          }).where(eq(shops.id, existing.id));
        }
      }
      console.log("Restored shop settings");
    }
  }

  const existingCoupons = await db.select().from(coupons);
  if (existingCoupons.length === 0) {
    console.log("Seeding coupons...");
    for (const coupon of seedCoupons) {
      await db.insert(coupons).values(coupon);
    }
    console.log(`Seeded ${seedCoupons.length} coupons`);
  } else {
    console.log(`Coupons already exist (${existingCoupons.length}), skipping...`);
  }
}
