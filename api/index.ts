import type { VercelRequest, VercelResponse } from "@vercel/node";
  import express, { type Request, Response, NextFunction } from "express";
  import { neon } from "@neondatabase/serverless";
  import crypto from "crypto";

  // ─── DB接続（生SQL） ───
  const sql = neon(process.env.DATABASE_URL!);

  // ─── 認証ユーティリティ ───
  function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  // ─── 予約テーブル初期化 ───
  let tablesInitialized = false;
  async function initBookingTables() {
    if (tablesInitialized) return;
    try {
      await sql`CREATE TABLE IF NOT EXISTS booking_staff (
        id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL,
        name TEXT NOT NULL, role TEXT DEFAULT '', avatar TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS booking_courses (
        id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL,
        name TEXT NOT NULL, category TEXT DEFAULT '', duration INTEGER DEFAULT 60,
        price INTEGER DEFAULT 0, description TEXT DEFAULT '',
        prepayment_only BOOLEAN DEFAULT false, image_url TEXT,
        staff_ids TEXT[] DEFAULT '{}', is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS booking_reservations (
        id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL, customer_phone TEXT, customer_email TEXT,
        date TEXT NOT NULL, time TEXT NOT NULL, staff_id TEXT DEFAULT '__shop__',
        course_id TEXT NOT NULL, status TEXT DEFAULT 'confirmed',
        paid BOOLEAN DEFAULT false, cancel_token TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS booking_settings (
        shop_id INTEGER PRIMARY KEY, store_name TEXT DEFAULT '',
        store_description TEXT DEFAULT '', store_address TEXT DEFAULT '',
        store_phone TEXT DEFAULT '', store_email TEXT DEFAULT '',
        store_hours TEXT DEFAULT '', store_closed_days TEXT DEFAULT '',
        banner_url TEXT DEFAULT '', staff_selection_enabled TEXT DEFAULT 'false',
        updated_at TIMESTAMP DEFAULT NOW()
      )`;
      tablesInitialized = true;
    } catch (e) {
      console.error("initBookingTables error:", e);
    }
  }

  // ─── デモデータ ───
  const DEMO_DATA: Record<number, {
    staff: { name: string; role: string; avatar: string }[];
    courses: { name: string; category: string; duration: number; price: number; description: string; prepaymentOnly: boolean }[];
    settings: Record<string, string>;
  }> = {
    1: {
      staff: [
        { name: "佐藤 健太", role: "料理長", avatar: "佐健" },
        { name: "高橋 裕子", role: "副料理長", avatar: "高裕" },
      ],
      courses: [
        { name: "特製ラーメンコース", category: "食事", duration: 60, price: 2800, description: "自家製麺と特製スープの極上ラーメンコース。前菜・餃子・デザート付き。", prepaymentOnly: false },
        { name: "宴会プラン（2時間）", category: "宴会", duration: 120, price: 4500, description: "飲み放題付き宴会プラン。ラーメン・チャーハン・餃子など全8品。", prepaymentOnly: true },
        { name: "ランチセット予約", category: "食事", duration: 45, price: 1200, description: "日替わりラーメン＋ミニチャーハン＋ドリンクのお得なランチセット。", prepaymentOnly: false },
      ],
      settings: { store_name: "麺処 小田原屋", store_description: "自家製麺と厳選スープのこだわりラーメン店", store_address: "神奈川県小田原市栄町2-1-5", store_phone: "0465-22-1234", store_email: "info@odawaraya.jp", store_hours: "11:00〜22:00（L.O. 21:30）", store_closed_days: "毎週水曜日", banner_url: "", staff_selection_enabled: "false" },
    },
    3: {
      staff: [
        { name: "田中 美咲", role: "オーナースタイリスト", avatar: "田美" },
        { name: "佐藤 優花", role: "シニアスタイリスト", avatar: "佐優" },
        { name: "山本 凛", role: "スタイリスト", avatar: "山凛" },
        { name: "鈴木 愛", role: "ジュニアスタイリスト", avatar: "鈴愛" },
      ],
      courses: [
        { name: "カット", category: "ヘア", duration: 60, price: 4400, description: "カウンセリング・シャンプー・カット・ブロー込みのスタンダードメニュー。", prepaymentOnly: false },
        { name: "カット＋カラー", category: "ヘア", duration: 120, price: 9800, description: "カットとカラーのセットメニュー。オーガニックカラー使用。", prepaymentOnly: false },
        { name: "カット＋パーマ", category: "ヘア", duration: 150, price: 13200, description: "カットとパーマのセットメニュー。デジタルパーマも対応。", prepaymentOnly: false },
        { name: "ヘッドスパ", category: "リラクゼーション", duration: 45, price: 5500, description: "頭皮ケア＆リラクゼーション。炭酸泉使用。", prepaymentOnly: false },
      ],
      settings: { store_name: "Hair Salon MIKU", store_description: "あなたの魅力を引き出すヘアサロン", store_address: "神奈川県大和市中央3-5-8", store_phone: "046-261-3456", store_email: "info@salon-miku.jp", store_hours: "10:00〜20:00（最終受付19:00）", store_closed_days: "毎週火曜日", banner_url: "", staff_selection_enabled: "true" },
    },
  };

  async function seedShopIfEmpty(shopId: number) {
    const existing = await sql`SELECT id FROM booking_courses WHERE shop_id = ${shopId} LIMIT 1`;
    if (existing.length > 0) return;
    const demo = DEMO_DATA[shopId];
    if (!demo) {
      const shopRows = await sql`SELECT name, description, address, phone, hours, closed_days, image_url FROM shops WHERE id = ${shopId}`;
      if (shopRows.length === 0) return;
      const s = shopRows[0];
      await sql`INSERT INTO booking_courses (shop_id, name, category, duration, price, description, prepayment_only) VALUES (${shopId}, '通常コース', 'スタンダード', 60, 3000, '標準コースです。', false)`;
      await sql`INSERT INTO booking_settings (shop_id, store_name, store_description, store_address, store_phone, store_hours, store_closed_days, banner_url, staff_selection_enabled)
        VALUES (${shopId}, ${s.name||''}, ${s.description||''}, ${s.address||''}, ${s.phone||''}, ${s.hours||''}, ${s.closed_days||''}, ${s.image_url||''}, 'false')
        ON CONFLICT (shop_id) DO NOTHING`;
      return;
    }
    const allStaffIds: string[] = [];
    for (const st of demo.staff) {
      const row = await sql`INSERT INTO booking_staff (shop_id, name, role, avatar) VALUES (${shopId}, ${st.name}, ${st.role}, ${st.avatar}) RETURNING id`;
      allStaffIds.push(row[0].id.toString());
    }
    for (const c of demo.courses) {
      await sql`INSERT INTO booking_courses (shop_id, name, category, duration, price, description, prepayment_only, staff_ids)
        VALUES (${shopId}, ${c.name}, ${c.category}, ${c.duration}, ${c.price}, ${c.description}, ${c.prepaymentOnly}, ${allStaffIds})`;
    }
    const s = demo.settings;
    await sql`INSERT INTO booking_settings (shop_id, store_name, store_description, store_address, store_phone, store_email, store_hours, store_closed_days, banner_url, staff_selection_enabled)
      VALUES (${shopId}, ${s.store_name}, ${s.store_description}, ${s.store_address}, ${s.store_phone}, ${s.store_email||''}, ${s.store_hours}, ${s.store_closed_days}, ${s.banner_url||''}, ${s.staff_selection_enabled||'false'})
      ON CONFLICT (shop_id) DO NOTHING`;
  }

  // ─── Express ───
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(async (_req, _res, next) => { try { await initBookingTables(); } catch(e) {} next(); });

  function toShop(r: any) {
    return { ...r, galleryImageUrls: r.gallery_image_urls, isActive: r.is_active, enableStaffAssignment: r.enable_staff_assignment, displayOrder: r.display_order, lineAccountUrl: r.line_account_url, imageUrl: r.image_url, reservationUrl: r.reservation_url, reservationImageUrl: r.reservation_image_url, likeCount: r.like_count, stripeConnectId: r.stripe_connect_id, stripeConnectStatus: r.stripe_connect_status, areaId: r.area_id, closedDays: r.closed_days, updatedAt: r.updated_at, createdAt: r.created_at };
  }

  // ─── エリア ───
  app.get("/api/areas", async (_req, res) => {
    try { res.json(await sql`SELECT * FROM areas ORDER BY id`); }
    catch (e: any) { console.error("areas error:", e); res.status(500).json({ message: "Failed to fetch areas" }); }
  });

  // ─── カテゴリ ───
  app.get("/api/categories", async (_req, res) => {
    try { res.json(await sql`SELECT * FROM categories ORDER BY id`); }
    catch (e: any) { console.error("categories error:", e); res.status(500).json({ message: "Failed to fetch categories" }); }
  });

  // ─── 店舗 ───
  app.get("/api/shops", async (req, res) => {
    try {
      const { areaId, categoryId } = req.query;
      let rows;
      if (areaId) {
        rows = await sql`SELECT * FROM shops WHERE area_id = ${parseInt(areaId as string)} ORDER BY display_order DESC, updated_at DESC`;
      } else if (categoryId) {
        rows = await sql`SELECT s.* FROM shops s JOIN shop_categories sc ON sc.shop_id = s.id WHERE sc.category_id = ${parseInt(categoryId as string)} ORDER BY s.display_order DESC, s.updated_at DESC`;
      } else {
        rows = await sql`SELECT * FROM shops ORDER BY display_order DESC, updated_at DESC`;
      }
      res.json(rows.map(toShop));
    } catch (e: any) { console.error("shops error:", e); res.status(500).json({ message: "Failed to fetch shops" }); }
  });

  app.get("/api/shops/slug/:slug", async (req, res) => {
    try {
      const rows = await sql`SELECT * FROM shops WHERE slug = ${req.params.slug}`;
      if (!rows[0]) return res.status(404).json({ message: "Shop not found" });
      res.json(toShop(rows[0]));
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch shop" }); }
  });

  app.get("/api/shops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid shop ID" });
      const rows = await sql`SELECT * FROM shops WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ message: "Shop not found" });
      res.json(toShop(rows[0]));
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch shop" }); }
  });

  app.post("/api/shops", async (req, res) => {
    try {
      const b = req.body;
      const slug = b.slug || crypto.randomUUID().replace(/-/g,'').slice(0,10);
      const rows = await sql`INSERT INTO shops (
        slug, name, description, area_id, area, category, subcategory,
        address, phone, hours, closed_days, website, display_order,
        line_account_url, image_url, gallery_image_urls,
        is_active, enable_staff_assignment, reservation_url, reservation_image_url, like_count
      ) VALUES (
        ${slug}, ${b.name||''}, ${b.description||''}, ${b.areaId||1}, ${b.area||''}, ${b.category||''}, ${b.subcategory||null},
        ${b.address||''}, ${b.phone||null}, ${b.hours||null}, ${b.closedDays||null}, ${b.website||null}, ${b.displayOrder||0},
        ${b.lineAccountUrl||null}, ${b.imageUrl||''}, ${b.galleryImageUrls||[]},
        ${b.isActive!==false}, ${b.enableStaffAssignment||false}, ${b.reservationUrl||null}, ${b.reservationImageUrl||null}, ${b.likeCount||0}
      ) RETURNING *`;
      res.status(201).json(toShop(rows[0]));
    } catch (e: any) { console.error("shop create error:", e); res.status(500).json({ message: "Failed to create shop" }); }
  })

);

  app.put("/api/shops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid shop ID" });
      const b = req.body;
      if (b.name !== undefined) await sql`UPDATE shops SET name=${b.name} WHERE id=${id}`;
      if (b.description !== undefined) await sql`UPDATE shops SET description=${b.description} WHERE id=${id}`;
      if (b.area !== undefined) await sql`UPDATE shops SET area=${b.area} WHERE id=${id}`;
      if (b.category !== undefined) await sql`UPDATE shops SET category=${b.category} WHERE id=${id}`;
      if (b.subcategory !== undefined) await sql`UPDATE shops SET subcategory=${b.subcategory} WHERE id=${id}`;
      if (b.address !== undefined) await sql`UPDATE shops SET address=${b.address} WHERE id=${id}`;
      if (b.phone !== undefined) await sql`UPDATE shops SET phone=${b.phone} WHERE id=${id}`;
      if (b.hours !== undefined) await sql`UPDATE shops SET hours=${b.hours} WHERE id=${id}`;
      if (b.closedDays !== undefined) await sql`UPDATE shops SET closed_days=${b.closedDays} WHERE id=${id}`;
      if (b.website !== undefined) await sql`UPDATE shops SET website=${b.website} WHERE id=${id}`;
      if (b.displayOrder !== undefined) await sql`UPDATE shops SET display_order=${b.displayOrder} WHERE id=${id}`;
      if (b.lineAccountUrl !== undefined) await sql`UPDATE shops SET line_account_url=${b.lineAccountUrl} WHERE id=${id}`;
      if (b.imageUrl !== undefined) await sql`UPDATE shops SET image_url=${b.imageUrl} WHERE id=${id}`;
      if (b.galleryImageUrls !== undefined) await sql`UPDATE shops SET gallery_image_urls=${b.galleryImageUrls} WHERE id=${id}`;
      if (b.isActive !== undefined) await sql`UPDATE shops SET is_active=${b.isActive} WHERE id=${id}`;
      if (b.enableStaffAssignment !== undefined) await sql`UPDATE shops SET enable_staff_assignment=${b.enableStaffAssignment} WHERE id=${id}`;
      if (b.reservationUrl !== undefined) await sql`UPDATE shops SET reservation_url=${b.reservationUrl} WHERE id=${id}`;
      if (b.reservationImageUrl !== undefined) await sql`UPDATE shops SET reservation_image_url=${b.reservationImageUrl} WHERE id=${id}`;
      if (b.likeCount !== undefined) await sql`UPDATE shops SET like_count=${b.likeCount} WHERE id=${id}`;
      if (b.stripeConnectId !== undefined) await sql`UPDATE shops SET stripe_connect_id=${b.stripeConnectId} WHERE id=${id}`;
      if (b.stripeConnectStatus !== undefined) await sql`UPDATE shops SET stripe_connect_status=${b.stripeConnectStatus} WHERE id=${id}`;
      await sql`UPDATE shops SET updated_at=NOW() WHERE id=${id}`;
      const rows = await sql`SELECT * FROM shops WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ message: "Shop not found" });
      res.json(toShop(rows[0]));
    } catch (e: any) { console.error("shop update error:", e); res.status(500).json({ message: "Failed to update shop" }); }
  });

);

  app.post("/api/shops/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid shop ID" });
      const rows = await sql`UPDATE shops SET like_count = like_count + 1 WHERE id = ${id} RETURNING like_count`;
      res.json({ likeCount: rows[0]?.like_count });
    } catch (e: any) { res.status(500).json({ message: "Failed to like shop" }); }
  });

  // ─── クーポン ───
  function toCoupon(r: any) {
    return { ...r, shopId: r.shop_id, discountType: r.discount_type, discountValue: r.discount_value, isFirstTimeOnly: r.is_first_time_only, isLineAccountCoupon: r.is_line_account_coupon, isActive: r.is_active, validFrom: r.valid_from, validUntil: r.valid_until, expiryDate: r.expiry_date, createdAt: r.created_at, updatedAt: r.updated_at };
  }

  app.get("/api/shops/:id/coupons", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
      const rows = await sql`SELECT * FROM coupons WHERE shop_id = ${shopId} ORDER BY updated_at DESC`;
      res.json(rows.map(toCoupon));
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch coupons" }); }
  });

  app.post("/api/shops/:id/coupons", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
      const b = req.body;
      const rows = await sql`INSERT INTO coupons (shop_id, title, description, discount, discount_type, discount_value, expiry_date, is_first_time_only, is_line_account_coupon, is_active)
        VALUES (${shopId}, ${b.title||''}, ${b.description||null}, ${b.discount||null}, ${b.discountType||'FREE'}, ${b.discountValue||0}, ${b.expiryDate||null}, ${b.isFirstTimeOnly||false}, ${b.isLineAccountCoupon||false}, ${b.isActive!==false}) RETURNING *`;
      res.status(201).json(toCoupon(rows[0]));
    } catch (e: any) { console.error(e); res.status(500).json({ message: "Failed to create coupon" }); }
  });

  app.get("/api/coupons", async (_req, res) => {
    try { res.json((await sql`SELECT * FROM coupons ORDER BY updated_at DESC`).map(toCoupon)); }
    catch (e: any) { res.status(500).json({ message: "Failed to fetch coupons" }); }
  });

  app.put("/api/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid coupon ID" });
      const b = req.body;
      if (b.title !== undefined) await sql`UPDATE coupons SET title=${b.title} WHERE id=${id}`;
      if (b.description !== undefined) await sql`UPDATE coupons SET description=${b.description} WHERE id=${id}`;
      if (b.discount !== undefined) await sql`UPDATE coupons SET discount=${b.discount} WHERE id=${id}`;
      if (b.discountType !== undefined) await sql`UPDATE coupons SET discount_type=${b.discountType}::discount_type WHERE id=${id}`;
      if (b.discountValue !== undefined) await sql`UPDATE coupons SET discount_value=${b.discountValue} WHERE id=${id}`;
      if (b.expiryDate !== undefined) await sql`UPDATE coupons SET expiry_date=${b.expiryDate} WHERE id=${id}`;
      if (b.isFirstTimeOnly !== undefined) await sql`UPDATE coupons SET is_first_time_only=${b.isFirstTimeOnly} WHERE id=${id}`;
      if (b.isLineAccountCoupon !== undefined) await sql`UPDATE coupons SET is_line_account_coupon=${b.isLineAccountCoupon} WHERE id=${id}`;
      if (b.isActive !== undefined) await sql`UPDATE coupons SET is_active=${b.isActive} WHERE id=${id}`;
      await sql`UPDATE coupons SET updated_at=NOW() WHERE id=${id}`;
      const rows = await sql`SELECT * FROM coupons WHERE id=${id}`;
      if (!rows[0]) return res.status(404).json({ message: "Coupon not found" });
      res.json(toCoupon(rows[0]));
    } catch (e: any) { console.error("coupon update error:", e); res.status(500).json({ message: "Failed to update coupon" }); }
  });

);

  app.delete("/api/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid coupon ID" });
      const rows = await sql`DELETE FROM coupons WHERE id = ${id} RETURNING id`;
      if (!rows[0]) return res.status(404).json({ message: "Coupon not found" });
      res.json({ message: "Coupon deleted" });
    } catch (e: any) { res.status(500).json({ message: "Failed to delete coupon" }); }
  });

  // ─── 認証 ───
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: "Username and password required" });
      const rows = await sql`SELECT * FROM users WHERE username = ${username}`;
      const user = rows[0];
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      const valid = user.password_hash === password || hashPassword(password) === user.password_hash;
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });
      const payload = { userId: user.id, role: user.role, shopId: user.shop_id, exp: Date.now() + 7*24*60*60*1000 };
      const token = Buffer.from(JSON.stringify(payload)).toString("base64");
      res.json({ id: user.id, username: user.username, role: user.role, shopId: user.shop_id, token });
    } catch (e: any) { console.error("login error:", e); res.status(500).json({ message: "Login failed" }); }
  });

  app.post("/api/auth/logout", (_req, res) => res.json({ message: "Logged out" }));

  app.get("/api/auth/me", async (req, res) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated" });
    try {
      const decoded = JSON.parse(Buffer.from(h.substring(7), "base64").toString()) as { userId: number; role: string; shopId: number | null; exp: number };
      if (decoded.exp < Date.now()) return res.status(401).json({ message: "Token expired" });
      const rows = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
      if (!rows[0]) return res.status(401).json({ message: "User not found" });
      res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role, shopId: rows[0].shop_id });
    } catch (e: any) { res.status(401).json({ message: "Invalid token" }); }
  });

  // ─── スタッフ ───
  app.get("/api/shops/:shopId/staff", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await seedShopIfEmpty(shopId);
      const rows = await sql`SELECT * FROM booking_staff WHERE shop_id = ${shopId} AND is_active = true ORDER BY id`;
      const courses = await sql`SELECT id, staff_ids FROM booking_courses WHERE shop_id = ${shopId} AND is_active = true`;
      res.json(rows.map((s: any) => ({
        id: s.id.toString(), name: s.name, role: s.role||"", avatar: s.avatar||"",
        courseIds: courses.filter((c: any) => (c.staff_ids||[]).includes(s.id.toString())).map((c: any) => c.id.toString()),
      })));
    } catch (e: any) { console.error("staff error:", e); res.status(500).json({ message: "Failed to fetch staff" }); }
  });

  app.post("/api/shops/:shopId/staff", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { name, role, avatar } = req.body;
      const rows = await sql`INSERT INTO booking_staff (shop_id, name, role, avatar) VALUES (${shopId}, ${name||''}, ${role||''}, ${avatar||''}) RETURNING *`;
      const s = rows[0];
      res.status(201).json({ id: s.id.toString(), name: s.name, role: s.role, avatar: s.avatar, courseIds: [] });
    } catch (e: any) { res.status(500).json({ message: "Failed to create staff" }); }
  });

  app.put("/api/shops/:shopId/staff", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { id, name, role, avatar } = req.body;
      await sql`UPDATE booking_staff SET name=${name||''}, role=${role||''}, avatar=${avatar||''} WHERE id=${parseInt(id)} AND shop_id=${shopId}`;
      res.json({ id: id.toString(), name, role, avatar });
    } catch (e: any) { res.status(500).json({ message: "Failed to update staff" }); }
  });

  app.delete("/api/shops/:shopId/staff", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await sql`UPDATE booking_staff SET is_active=false WHERE id=${parseInt(req.query.id as string)} AND shop_id=${shopId}`;
      res.json({ message: "Staff deleted" });
    } catch (e: any) { res.status(500).json({ message: "Failed to delete staff" }); }
  });

  // ─── コース ───
  function toCourse(c: any) {
    return { id: c.id.toString(), name: c.name, category: c.category||"", duration: c.duration||60, price: c.price||0, description: c.description||"", prepaymentOnly: c.prepayment_only||false, imageUrl: c.image_url||null, staffIds: (c.staff_ids||[]).map((x: any)=>x.toString()) };
  }

  app.get("/api/shops/:shopId/courses", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await seedShopIfEmpty(shopId);
      const rows = await sql`SELECT * FROM booking_courses WHERE shop_id=${shopId} AND is_active=true ORDER BY id`;
      res.json(rows.map(toCourse));
    } catch (e: any) { console.error("courses error:", e); res.status(500).json({ message: "Failed to fetch courses" }); }
  });

  app.post("/api/shops/:shopId/courses", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { name, category, duration, price, description, prepaymentOnly, imageUrl, staffIds } = req.body;
      const rows = await sql`INSERT INTO booking_courses (shop_id, name, category, duration, price, description, prepayment_only, image_url, staff_ids)
        VALUES (${shopId}, ${name||''}, ${category||''}, ${duration||60}, ${price||0}, ${description||''}, ${prepaymentOnly||false}, ${imageUrl||null}, ${staffIds||[]}) RETURNING *`;
      res.status(201).json(toCourse(rows[0]));
    } catch (e: any) { res.status(500).json({ message: "Failed to create course" }); }
  });

  app.put("/api/shops/:shopId/courses", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { id, name, category, duration, price, description, prepaymentOnly, imageUrl, staffIds } = req.body;
      const rows = await sql`UPDATE booking_courses SET name=${name||''}, category=${category||''}, duration=${duration||60}, price=${price||0}, description=${description||''}, prepayment_only=${prepaymentOnly||false}, image_url=${imageUrl||null}, staff_ids=${staffIds||[]}, updated_at=NOW()
        WHERE id=${parseInt(id)} AND shop_id=${shopId} RETURNING *`;
      if (!rows[0]) return res.status(404).json({ message: "Course not found" });
      res.json(toCourse(rows[0]));
    } catch (e: any) { res.status(500).json({ message: "Failed to update course" }); }
  });

  app.delete("/api/shops/:shopId/courses", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await sql`UPDATE booking_courses SET is_active=false WHERE id=${parseInt(req.query.id as string)} AND shop_id=${shopId}`;
      res.json({ message: "Course deleted" });
    } catch (e: any) { res.status(500).json({ message: "Failed to delete course" }); }
  });

  // ─── スロット ───
  app.get("/api/shops/:shopId/slots", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const date = req.query.date as string;
      const slots: string[] = [];
      for (let h = 10; h <= 18; h++) { slots.push(`${String(h).padStart(2,"0")}:00`); if (h<18) slots.push(`${String(h).padStart(2,"0")}:30`); }
      if (!date) return res.json(slots.map(t=>({time:t,available:true})));
      const booked = await sql`SELECT time FROM booking_reservations WHERE shop_id=${shopId} AND date=${date} AND status!='cancelled'`;
      const bookedSet = new Set(booked.map((r: any)=>r.time));
      res.json(slots.map(t=>({time:t,available:!bookedSet.has(t)})));
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch slots" }); }
  });

  app.put("/api/shops/:shopId/slots", async (_req, res) => res.json({ ok: true }));
  app.post("/api/shops/:shopId/slots", async (_req, res) => res.json({ ok: true }));

  // ─── 設定 ───
  app.get("/api/shops/:shopId/settings", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await seedShopIfEmpty(shopId);
      const rows = await sql`SELECT * FROM booking_settings WHERE shop_id=${shopId}`;
      if (rows[0]) {
        const s = rows[0];
        return res.json({ store_name: s.store_name||"", store_description: s.store_description||"", store_address: s.store_address||"", store_phone: s.store_phone||"", store_email: s.store_email||"", store_hours: s.store_hours||"", store_closed_days: s.store_closed_days||"", banner_url: s.banner_url||"", staff_selection_enabled: s.staff_selection_enabled||"false" });
      }
      const shopRows = await sql`SELECT * FROM shops WHERE id=${shopId}`;
      if (!shopRows[0]) return res.status(404).json({ message: "Shop not found" });
      const s = shopRows[0];
      res.json({ store_name: s.name||"", store_description: s.description||"", store_address: s.address||"", store_phone: s.phone||"", store_email: "", store_hours: s.hours||"", store_closed_days: s.closed_days||"", banner_url: s.image_url||"", staff_selection_enabled: s.enable_staff_assignment?"true":"false" });
    } catch (e: any) { console.error("settings error:", e); res.status(500).json({ message: "Failed to fetch settings" }); }
  });

  app.put("/api/shops/:shopId/settings", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const s = req.body;
      await sql`INSERT INTO booking_settings (shop_id, store_name, store_description, store_address, store_phone, store_email, store_hours, store_closed_days, banner_url, staff_selection_enabled, updated_at)
        VALUES (${shopId}, ${s.store_name||''}, ${s.store_description||''}, ${s.store_address||''}, ${s.store_phone||''}, ${s.store_email||''}, ${s.store_hours||''}, ${s.store_closed_days||''}, ${s.banner_url||''}, ${s.staff_selection_enabled||'false'}, NOW())
        ON CONFLICT (shop_id) DO UPDATE SET store_name=${s.store_name||''}, store_description=${s.store_description||''}, store_address=${s.store_address||''}, store_phone=${s.store_phone||''}, store_email=${s.store_email||''}, store_hours=${s.store_hours||''}, store_closed_days=${s.store_closed_days||''}, banner_url=${s.banner_url||''}, staff_selection_enabled=${s.staff_selection_enabled||'false'}, updated_at=NOW()`;
      res.json(s);
    } catch (e: any) { res.status(500).json({ message: "Failed to update settings" }); }
  });

  // ─── 予約 ───
  function toReservation(r: any) {
    return { id: r.id.toString(), customerName: r.customer_name, customerPhone: r.customer_phone||undefined, customerEmail: r.customer_email||undefined, date: r.date, time: r.time, staffId: r.staff_id||"__shop__", courseId: r.course_id, status: r.status||"confirmed", paid: r.paid||false, reservationToken: r.cancel_token||undefined };
  }

  app.get("/api/shops/:shopId/reservations", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const rows = await sql`SELECT * FROM booking_reservations WHERE shop_id=${shopId} ORDER BY date DESC, time DESC`;
      res.json(rows.map(toReservation));
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch reservations" }); }
  });

  app.post("/api/shops/:shopId/reservations", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { customerName, customerPhone, customerEmail, date, time, staffId, courseId } = req.body;
      if (!customerName || !date || !time || !courseId) return res.status(400).json({ message: "Missing required fields" });
      const token = crypto.randomUUID().replace(/-/g,"");
      const rows = await sql`INSERT INTO booking_reservations (shop_id, customer_name, customer_phone, customer_email, date, time, staff_id, course_id, status, paid, cancel_token)
        VALUES (${shopId}, ${customerName}, ${customerPhone||null}, ${customerEmail||null}, ${date}, ${time}, ${staffId||'__shop__'}, ${courseId.toString()}, 'confirmed', false, ${token}) RETURNING *`;
      res.status(201).json(toReservation(rows[0]));
    } catch (e: any) { console.error("reservation error:", e); res.status(500).json({ message: "Failed to create reservation" }); }
  });

  app.put("/api/shops/:shopId/reservations", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const { id, status, paid, customerName, customerPhone, customerEmail, date, time } = req.body;
      const resId = parseInt(id);
      if (isNaN(resId)) return res.status(400).json({ message: "Invalid reservation ID" });
      // Update each field with tagged template literals
      if (status !== undefined) await sql`UPDATE booking_reservations SET status=${status} WHERE id=${resId} AND shop_id=${shopId}`;
      if (paid !== undefined) await sql`UPDATE booking_reservations SET paid=${paid} WHERE id=${resId} AND shop_id=${shopId}`;
      if (customerName !== undefined) await sql`UPDATE booking_reservations SET customer_name=${customerName} WHERE id=${resId} AND shop_id=${shopId}`;
      if (customerPhone !== undefined) await sql`UPDATE booking_reservations SET customer_phone=${customerPhone} WHERE id=${resId} AND shop_id=${shopId}`;
      if (customerEmail !== undefined) await sql`UPDATE booking_reservations SET customer_email=${customerEmail} WHERE id=${resId} AND shop_id=${shopId}`;
      if (date !== undefined) await sql`UPDATE booking_reservations SET date=${date} WHERE id=${resId} AND shop_id=${shopId}`;
      if (time !== undefined) await sql`UPDATE booking_reservations SET time=${time} WHERE id=${resId} AND shop_id=${shopId}`;
      const rows = await sql`SELECT * FROM booking_reservations WHERE id=${resId} AND shop_id=${shopId}`;
      if (!rows[0]) return res.status(404).json({ message: "Reservation not found" });
      res.json(toReservation(rows[0]));
    } catch (e: any) { console.error("res update error:", e); res.status(500).json({ message: "Failed to update reservation" }); }
  });

);

  app.delete("/api/shops/:shopId/reservations", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      await sql`DELETE FROM booking_reservations WHERE id=${parseInt(req.query.id as string)} AND shop_id=${shopId}`;
      res.json({ message: "Reservation deleted" });
    } catch (e: any) { res.status(500).json({ message: "Failed to delete reservation" }); }
  });

  // ─── キャンセル ───
  app.get("/api/shops/:shopId/cancel/:token", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const rows = await sql`
        SELECT r.*, c.name as course_name, c.duration as course_duration, c.price as course_price
        FROM booking_reservations r
        LEFT JOIN booking_courses c ON c.id::text = r.course_id AND c.shop_id = ${shopId}
        WHERE r.cancel_token=${req.params.token} AND r.shop_id=${shopId}`;
      if (!rows[0]) return res.status(404).json({ message: "Reservation not found" });
      const r = rows[0];
      res.json({ id: r.id.toString(), customerName: r.customer_name, date: r.date, time: r.time, courseId: r.course_id, courseName: r.course_name||"コース", courseDuration: r.course_duration||60, coursePrice: r.course_price||0, status: r.status });
    } catch (e: any) { res.status(500).json({ message: "Failed to fetch reservation" }); }
  });

  app.post("/api/shops/:shopId/cancel/:token", async (req, res) => {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) return res.status(400).json({ message: "Invalid shop ID" });
    try {
      const rows = await sql`SELECT status FROM booking_reservations WHERE cancel_token=${req.params.token} AND shop_id=${shopId}`;
      if (!rows[0]) return res.status(404).json({ message: "Reservation not found" });
      if (rows[0].status === "cancelled") return res.json({ ok: true, already: true });
      await sql`UPDATE booking_reservations SET status='cancelled' WHERE cancel_token=${req.params.token} AND shop_id=${shopId}`;
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: "Failed to cancel reservation" }); }
  });

  // ─── 問い合わせ ───
  app.post("/api/shops/:shopId/inquiries", async (_req, res) => res.status(201).json({ ok: true }));
  app.get("/api/shops/:shopId/inquiries", async (_req, res) => res.json([]));

  
  // ─── テストデータ一括生成 ───
  app.post("/api/seed-test", async (_req, res) => {
    try {
      const existing = await sql`SELECT id FROM shops WHERE slug = 'test-salon-hanagokoro'`;
      let shopId: number;
      if (existing.length > 0) {
        shopId = existing[0].id;
        await sql`DELETE FROM booking_courses WHERE shop_id = ${shopId}`;
        await sql`DELETE FROM booking_staff WHERE shop_id = ${shopId}`;
        await sql`DELETE FROM booking_settings WHERE shop_id = ${shopId}`;
        await sql`DELETE FROM booking_reservations WHERE shop_id = ${shopId}`;
        await sql`DELETE FROM coupons WHERE shop_id = ${shopId}`;
        await sql`UPDATE shops SET
          name='総合サロン はなごころ', description='小田原駅徒歩5分。ヘア・エステ・ネイル・リラクゼーションを一か所で。完全予約制の上質な空間。',
          area_id=1, area='小田原', category='美容', subcategory='トータルビューティー',
          address='神奈川県小田原市南町2-3-15 はなごころビル2F', phone='0465-33-8899',
          hours='10:00〜20:00（最終受付 19:00）', closed_days='毎週火曜日・第1月曜日',
          website='https://salon-hanagokoro.jp', display_order=99,
          line_account_url='https://line.me/R/ti/p/@salon-hanagokoro',
          image_url='https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
          gallery_image_urls=ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80','https://images.unsplash.com/photo-1573461160327-a85cf5a11ad5?w=800&q=80'],
          is_active=true, enable_staff_assignment=true, like_count=56, updated_at=NOW()
          WHERE id=${shopId}`;
      } else {
        const shopRows = await sql`INSERT INTO shops (
          slug, name, description, area_id, area, category, subcategory,
          address, phone, hours, closed_days, website, display_order,
          line_account_url, image_url, gallery_image_urls,
          is_active, enable_staff_assignment, like_count
        ) VALUES (
          'test-salon-hanagokoro', '総合サロン はなごころ',
          '小田原駅徒歩5分。ヘア・エステ・ネイル・リラクゼーションを一か所で。完全予約制の上質な空間。',
          1, '小田原', '美容', 'トータルビューティー',
          '神奈川県小田原市南町2-3-15 はなごころビル2F', '0465-33-8899',
          '10:00〜20:00（最終受付 19:00）', '毎週火曜日・第1月曜日',
          'https://salon-hanagokoro.jp', 99,
          'https://line.me/R/ti/p/@salon-hanagokoro',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
          ARRAY['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80','https://images.unsplash.com/photo-1573461160327-a85cf5a11ad5?w=800&q=80'],
          true, true, 56
        ) RETURNING id`;
        shopId = shopRows[0].id;
      }
      await sql`UPDATE shops SET reservation_url = '/app/reservation/' || ${shopId}::text WHERE id = ${shopId}`;

      // ─── スタッフ4名 ───
      const staffData = [
        { name: "山田 咲花", role: "オーナーサロニスト", avatar: "山咲" },
        { name: "中村 恵理", role: "シニアスタイリスト", avatar: "中恵" },
        { name: "木村 美羽", role: "エステシャン", avatar: "木美" },
        { name: "林 桜子", role: "ネイリスト", avatar: "林桜" },
      ];
      const sIds: string[] = [];
      for (const st of staffData) {
        const row = await sql`INSERT INTO booking_staff (shop_id, name, role, avatar) VALUES (${shopId}, ${st.name}, ${st.role}, ${st.avatar}) RETURNING id`;
        sIds.push(row[0].id.toString());
      }

      // ─── コース15件 ───
      const coursesData = [
        { name: "スタンダードカット", category: "ヘア", duration: 60, price: 4400, description: "カウンセリング・シャンプー・カット・ブロー込み。季節に合わせたスタイル提案。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1592339637627-3568de3c91dc?w=600&q=80", sIdxs: [0,1] },
        { name: "カット＋カラー（フルカラー）", category: "ヘア", duration: 150, price: 12800, description: "カットとオーガニックフルカラーのセット。ダメージを最小限に抑えた上質なカラーリング。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&q=80", sIdxs: [0,1] },
        { name: "カット＋ハイライトカラー", category: "ヘア", duration: 180, price: 18500, description: "立体感を演出するハイライトカラー＋カット。外国人風スタイルや旬の透明感カラーに対応。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80", sIdxs: [0] },
        { name: "デジタルパーマ（カット込み）", category: "ヘア", duration: 210, price: 22000, description: "熱を使い持続性・再現性の高いウェーブを実現。スタイリングが楽になる人気メニュー。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80", sIdxs: [0,1] },
        { name: "縮毛矯正（ストレートパーマ）", category: "ヘア", duration: 240, price: 28600, description: "くせ毛・うねりを根本から改善。艶やかなストレートヘアを実現する高技術メニュー。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80", sIdxs: [0] },
        { name: "フェイシャルエステ（60分）", category: "エステ", duration: 60, price: 8800, description: "毛穴洗浄・保湿・引き締めの3ステップで透明感のある肌へ。最新機器使用。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80", sIdxs: [2] },
        { name: "フェイシャルエステ（90分・プレミアム）", category: "エステ", duration: 90, price: 14300, description: "クレンジング・スチーム・超音波・高周波・保湿パックの本格コース。特別な日の前に。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80", sIdxs: [2] },
        { name: "痩身エステ（ボディ60分）", category: "エステ", duration: 60, price: 11000, description: "EMSとキャビテーションを組み合わせた本格ボディケア。気になる部位に集中アプローチ。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80", sIdxs: [2] },
        { name: "毛穴クレンジング（ハイドラフェイシャル）", category: "エステ", duration: 45, price: 6600, description: "水流を使って毛穴の黒ずみや皮脂を徹底除去。ダウンタイムなしで即効性あり。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1573461160327-a85cf5a11ad5?w=600&q=80", sIdxs: [2] },
        { name: "ジェルネイル（手・ワンカラー）", category: "ネイル", duration: 90, price: 6600, description: "ワンカラーのシンプルジェルネイル。オフ込みで仕上がりが美しい人気定番メニュー。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80", sIdxs: [3] },
        { name: "ジェルネイル（手・アート込み）", category: "ネイル", duration: 120, price: 9900, description: "季節感のあるアートデザイン込みジェルネイル。SNS映えするスタイリッシュなデザイン。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80", sIdxs: [3] },
        { name: "フットネイル（ペディキュア＋ジェル）", category: "ネイル", duration: 90, price: 7700, description: "フット角質ケア・ペディキュア・ジェルカラーのフルコース。夏のサンダルシーズンに。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80", sIdxs: [3] },
        { name: "アロマトリートメント（60分）", category: "リラクゼーション", duration: 60, price: 9900, description: "厳選された天然アロマオイルを使ったスウェディッシュマッサージ。心身の疲れを癒します。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80", sIdxs: [2] },
        { name: "ヘッドスパ（炭酸泉＋マッサージ45分）", category: "リラクゼーション", duration: 45, price: 5500, description: "炭酸泉シャンプー後に頭皮マッサージ。血行促進・育毛・リフレッシュ効果が高い人気メニュー。", prepaymentOnly: false, imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80", sIdxs: [0,1] },
        { name: "総合美容フルコース（3時間）", category: "プレミアム", duration: 180, price: 39600, description: "カット＋カラー＋フェイシャルエステ＋ヘッドスパの贅沢コース。特別な日に最高の自分に。", prepaymentOnly: true, imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80", sIdxs: [0,1,2,3] },
      ];
      const createdCourseIds: string[] = [];
      for (const c of coursesData) {
        const staffIdsForCourse = c.sIdxs.map((i: number) => sIds[i]);
        const row = await sql`INSERT INTO booking_courses (shop_id, name, category, duration, price, description, prepayment_only, image_url, staff_ids)
          VALUES (${shopId}, ${c.name}, ${c.category}, ${c.duration}, ${c.price}, ${c.description}, ${c.prepaymentOnly}, ${c.imageUrl}, ${staffIdsForCourse}) RETURNING id`;
        createdCourseIds.push(row[0].id.toString());
      }

      // ─── 設定 ───
      await sql`INSERT INTO booking_settings (shop_id, store_name, store_description, store_address, store_phone, store_email, store_hours, store_closed_days, banner_url, staff_selection_enabled)
        VALUES (${shopId}, '総合サロン はなごころ', '小田原駅徒歩5分。ヘア・エステ・ネイル・リラクゼーションを一か所で。', '神奈川県小田原市南町2-3-15 はなごころビル2F', '0465-33-8899', 'info@salon-hanagokoro.jp', '10:00〜20:00（最終受付19:00）', '毎週火曜日・第1月曜日', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', 'true')
        ON CONFLICT (shop_id) DO UPDATE SET store_name='総合サロン はなごころ', store_description='小田原駅徒歩5分。ヘア・エステ・ネイル・リラクゼーションを一か所で。', store_address='神奈川県小田原市南町2-3-15 はなごころビル2F', store_phone='0465-33-8899', store_email='info@salon-hanagokoro.jp', store_hours='10:00〜20:00（最終受付19:00）', store_closed_days='毎週火曜日・第1月曜日', banner_url='https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', staff_selection_enabled='true', updated_at=NOW()`;

      // ─── クーポン5枚 ───
      const cps = [
        { title: "新規お客様限定20%OFF", description: "ご新規様全メニュー20%割引", discountType: "PERCENTAGE", discountValue: 20, expiryDate: "2026-09-30", isFirstTimeOnly: true, isLineAccountCoupon: false },
        { title: "LINEお友達追加500円OFF", description: "LINEお友達追加で次回ご来店時500円割引", discountType: "AMOUNT", discountValue: 500, expiryDate: "2026-12-31", isFirstTimeOnly: false, isLineAccountCoupon: true },
        { title: "誕生月特典 ヘッドスパ無料", description: "お誕生月のお客様にヘッドスパ（通常¥5,500）を無料プレゼント", discountType: "FREE", discountValue: 0, expiryDate: "2026-12-31", isFirstTimeOnly: false, isLineAccountCoupon: false },
        { title: "春の美容応援1,000円OFF", description: "フェイシャル・痩身エステご利用で1,000円引き（6月末まで）", discountType: "AMOUNT", discountValue: 1000, expiryDate: "2026-06-30", isFirstTimeOnly: false, isLineAccountCoupon: false },
        { title: "平日午前10%OFF", description: "平日10:00〜12:00のご予約で全メニュー10%割引", discountType: "PERCENTAGE", discountValue: 10, expiryDate: "2026-09-30", isFirstTimeOnly: false, isLineAccountCoupon: false },
      ];
      for (const cp of cps) {
        await sql`INSERT INTO coupons (shop_id, title, description, discount_type, discount_value, expiry_date, is_first_time_only, is_line_account_coupon, is_active)
          VALUES (${shopId}, ${cp.title}, ${cp.description}, ${cp.discountType}::discount_type, ${cp.discountValue}, ${cp.expiryDate}, ${cp.isFirstTimeOnly}, ${cp.isLineAccountCoupon}, true)`;
      }

      // ─── テスト予約5件 ───
      const rvs = [
        { name: "田中 花子", phone: "090-1111-2222", email: "hanako@example.com", date: "2026-04-05", time: "10:00", ci: 0, si: 0, status: "confirmed", paid: false },
        { name: "鈴木 恵美", phone: "080-3333-4444", email: "emi@example.com", date: "2026-04-07", time: "13:00", ci: 1, si: 1, status: "confirmed", paid: false },
        { name: "山本 真奈", phone: "070-5555-6666", email: "mana@example.com", date: "2026-04-10", time: "14:30", ci: 5, si: 2, status: "confirmed", paid: true },
        { name: "伊藤 さくら", phone: "090-7777-8888", email: "sakura@example.com", date: "2026-03-20", time: "11:00", ci: 9, si: 3, status: "visited", paid: true },
        { name: "渡辺 美里", phone: "080-9999-0000", email: "misato@example.com", date: "2026-03-15", time: "15:00", ci: 12, si: 2, status: "cancelled", paid: false },
      ];
      for (const rv of rvs) {
        const tkn = crypto.randomUUID().replace(/-/g,"");
        await sql`INSERT INTO booking_reservations (shop_id, customer_name, customer_phone, customer_email, date, time, course_id, staff_id, status, paid, cancel_token)
          VALUES (${shopId}, ${rv.name}, ${rv.phone}, ${rv.email}, ${rv.date}, ${rv.time}, ${createdCourseIds[rv.ci]}, ${sIds[rv.si]}, ${rv.status}, ${rv.paid}, ${tkn})`;
      }

      res.json({ ok: true, shopId, staffCount: sIds.length, courseCount: coursesData.length, couponCount: cps.length, reservationCount: rvs.length });
    } catch (e: any) { console.error("seed-test error:", e); res.status(500).json({ message: "Seed test failed", error: e.message }); }
  });

  // ─── Error handler ───
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Internal error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
  });

  export default async function handler(req: VercelRequest, res: VercelResponse) {
    return app(req as any, res as any);
  }
  