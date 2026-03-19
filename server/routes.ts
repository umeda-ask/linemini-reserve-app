import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShopSchema, insertCouponSchema } from "@shared/schema";
import { bookingManager } from "./booking-store";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const uploadsDir = path.join(process.cwd(), "server", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = MIME_TO_EXT[file.mimetype] || ".jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, png, gif, webp) are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }));

  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
  app.get("/api/shops", async (_req, res) => {
    try {
      const shops = await storage.getShops();
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });

  app.post("/api/shops", async (req, res) => {
    try {
      const parsed = insertShopSchema.safeParse({
        displayOrder: 0,
        hasLineAccountCoupon: false,
        ...req.body,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.errors });
      }
      const shop = await storage.createShop(parsed.data);
      res.status(201).json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to create shop" });
    }
  });

  app.get("/api/shops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      const shop = await storage.getShopById(id);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  app.put("/api/shops/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      const partial = insertShopSchema.partial().safeParse(req.body);
      if (!partial.success) {
        return res.status(400).json({ message: "Invalid request body", errors: partial.error.errors });
      }
      const shop = await storage.updateShop(id, partial.data);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  app.get("/api/shops/:id/coupons", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      const shopCoupons = await storage.getCouponsByShopId(shopId);
      res.json(shopCoupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/shops/:id/coupons", async (req, res) => {
    try {
      const shopId = parseInt(req.params.id);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      const parsed = insertCouponSchema.omit({ shopId: true }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.errors });
      }
      const coupon = await storage.createCoupon({ ...parsed.data, shopId });
      res.status(201).json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  app.get("/api/coupons", async (_req, res) => {
    try {
      const allCoupons = await storage.getAllCoupons();
      res.json(allCoupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.put("/api/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      const partial = insertCouponSchema.partial().safeParse(req.body);
      if (!partial.success) {
        return res.status(400).json({ message: "Invalid request body", errors: partial.error.errors });
      }
      const coupon = await storage.updateCoupon(id, partial.data);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  app.delete("/api/coupons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid coupon ID" });
      }
      const deleted = await storage.deleteCoupon(id);
      if (!deleted) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json({ message: "Coupon deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // ===== Per-Shop Booking API Routes =====

  function getBookingStore(req: any, res: any) {
    const shopId = parseInt(req.params.shopId);
    if (isNaN(shopId)) {
      res.status(400).json({ error: "Invalid shop ID" });
      return null;
    }
    const store = bookingManager.getStore(shopId);
    if (!store) {
      res.status(404).json({ error: "No booking system for this shop" });
      return null;
    }
    return store;
  }

  app.get("/api/shops/:shopId/staff", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const staffWithCourses = store.staff.map((s) => ({
      ...s,
      courseIds: store.courses.filter((c) => c.staffIds.includes(s.id)).map((c) => c.id),
    }));
    res.json(staffWithCourses);
  });

  app.post("/api/shops/:shopId/staff", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    if (!body.name || !body.role) {
      return res.status(400).json({ error: "name and role are required" });
    }
    const id = store.genId();
    const s = {
      id,
      name: body.name,
      role: body.role,
      avatar: body.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
      courseIds: [] as string[],
    };
    store.staff.push(s);
    res.json({ id });
  });

  app.put("/api/shops/:shopId/staff", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const idx = store.staff.findIndex((s) => s.id === body.id);
    if (idx === -1) return res.json({ ok: true });
    store.staff[idx] = {
      ...store.staff[idx],
      name: body.name ?? store.staff[idx].name,
      role: body.role ?? store.staff[idx].role,
      avatar: body.name
        ? body.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
        : store.staff[idx].avatar,
    };
    res.json({ ok: true });
  });

  app.delete("/api/shops/:shopId/staff", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const id = req.query.id as string;
    store.staff = store.staff.filter((s) => s.id !== id);
    for (const c of store.courses) {
      c.staffIds = c.staffIds.filter((sid) => sid !== id);
    }
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/courses", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    res.json(store.courses);
  });

  app.post("/api/shops/:shopId/courses", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    if (!body.name || !body.category || !body.duration || body.price == null) {
      return res.status(400).json({ error: "name, category, duration, and price are required" });
    }
    const id = store.genId();
    const course = {
      id,
      name: body.name,
      category: body.category,
      duration: body.duration,
      price: body.price,
      description: body.description || "",
      prepaymentOnly: body.prepaymentOnly ?? false,
      imageUrl: body.imageUrl || null,
      staffIds: body.staffIds || [],
    };
    store.courses.push(course);
    if (body.staffIds?.length) {
      for (const sid of body.staffIds) {
        const s = store.staff.find((st) => st.id === sid);
        if (s && !s.courseIds.includes(id)) s.courseIds.push(id);
      }
    }
    res.json({ id });
  });

  app.put("/api/shops/:shopId/courses", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const idx = store.courses.findIndex((c) => c.id === body.id);
    if (idx === -1) return res.json({ ok: true });
    store.courses[idx] = {
      ...store.courses[idx],
      name: body.name ?? store.courses[idx].name,
      category: body.category ?? store.courses[idx].category,
      duration: body.duration ?? store.courses[idx].duration,
      price: body.price ?? store.courses[idx].price,
      description: body.description ?? store.courses[idx].description,
      prepaymentOnly: body.prepaymentOnly ?? store.courses[idx].prepaymentOnly,
      imageUrl: body.imageUrl ?? store.courses[idx].imageUrl,
      staffIds: body.staffIds ?? store.courses[idx].staffIds,
    };
    res.json({ ok: true });
  });

  app.delete("/api/shops/:shopId/courses", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const id = req.query.id as string;
    store.courses = store.courses.filter((c) => c.id !== id);
    for (const s of store.staff) {
      s.courseIds = s.courseIds.filter((cid) => cid !== id);
    }
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/reservations", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    res.json(
      store.reservations.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        date: r.date,
        time: r.time,
        staffId: r.staffId,
        courseId: r.courseId,
        status: r.status,
        paid: r.paid,
      }))
    );
  });

  app.post("/api/shops/:shopId/reservations", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const id = store.genId();
    const cancelToken = store.genToken();
    const reservation = {
      id,
      customerName: body.customerName,
      customerPhone: body.customerPhone || undefined,
      customerEmail: body.customerEmail || undefined,
      date: body.date,
      time: body.time,
      staffId: body.staffId,
      courseId: body.courseId,
      status: (body.status || "pending") as "confirmed" | "pending" | "cancelled",
      paid: body.paid ?? false,
      cancelToken,
    };
    store.reservations.push(reservation);
    res.json({ id, cancelToken });
  });

  app.put("/api/shops/:shopId/reservations", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const idx = store.reservations.findIndex((r) => r.id === body.id);
    if (idx === -1) return res.json({ ok: true });
    if (body.status) store.reservations[idx].status = body.status;
    if (body.paid !== undefined) store.reservations[idx].paid = body.paid;
    if (body.customerName) store.reservations[idx].customerName = body.customerName;
    if (body.customerPhone !== undefined) store.reservations[idx].customerPhone = body.customerPhone;
    if (body.customerEmail !== undefined) store.reservations[idx].customerEmail = body.customerEmail;
    if (body.date) store.reservations[idx].date = body.date;
    if (body.time) store.reservations[idx].time = body.time;
    if (body.staffId) store.reservations[idx].staffId = body.staffId;
    if (body.courseId) store.reservations[idx].courseId = body.courseId;
    res.json({ ok: true });
  });

  app.delete("/api/shops/:shopId/reservations", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const id = req.query.id as string;
    if (id) {
      store.reservations = store.reservations.filter((r) => r.id !== id);
    }
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/cancel/:token", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const token = req.params.token;
    const reservation = store.reservations.find((r) => r.cancelToken === token);
    if (!reservation) return res.status(404).json({ error: "予約が見つかりません" });
    const course = store.courses.find((c) => c.id === reservation.courseId);
    res.json({
      id: reservation.id,
      customerName: reservation.customerName,
      date: reservation.date,
      time: reservation.time,
      courseId: reservation.courseId,
      courseName: course?.name || "",
      courseDuration: course?.duration || 0,
      coursePrice: course?.price || 0,
      status: reservation.status,
    });
  });

  app.post("/api/shops/:shopId/cancel/:token", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const token = req.params.token;
    const reservation = store.reservations.find((r) => r.cancelToken === token);
    if (!reservation) return res.status(404).json({ error: "予約が見つかりません" });
    if (reservation.status === "cancelled") return res.json({ ok: true, already: true });
    reservation.status = "cancelled";
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/slots", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const staffId = req.query.staffId as string;
    const date = req.query.date as string;
    if (staffId && date) {
      return res.json(store.getTimeSlots(staffId, date));
    }
    if (staffId) {
      return res.json(store.getStaffSlots(staffId));
    }
    res.json([]);
  });

  app.put("/api/shops/:shopId/slots", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const staffId = body.staffId as string;
    const dayOfWeek = body.dayOfWeek as number;
    const time = body.time as string;
    const available = body.available as boolean;
    const existing = store.slots.find(
      (s) => s.staffId === staffId && s.dayOfWeek === dayOfWeek && s.time === time
    );
    if (existing) {
      existing.available = available;
    } else {
      store.slots.push({
        id: store.genId(),
        staffId,
        dayOfWeek,
        time,
        available,
      });
    }
    res.json({ ok: true });
  });

  app.post("/api/shops/:shopId/slots", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const staffId = body.staffId as string;
    const dayOfWeek = body.dayOfWeek as number;
    const times = body.times as string[];
    const available = body.available as boolean;
    for (const time of times) {
      const existing = store.slots.find(
        (s) => s.staffId === staffId && s.dayOfWeek === dayOfWeek && s.time === time
      );
      if (existing) {
        existing.available = available;
      } else {
        store.slots.push({
          id: store.genId(),
          staffId,
          dayOfWeek,
          time,
          available,
        });
      }
    }
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/settings", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    res.json(store.settings);
  });

  app.put("/api/shops/:shopId/settings", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    for (const [key, value] of Object.entries(body)) {
      store.settings[key] = value as string;
    }
    res.json({ ok: true });
  });

  app.get("/api/shops/:shopId/inquiries", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    res.json(store.inquiries);
  });

  app.post("/api/shops/:shopId/inquiries", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const inquiry = {
      id: store.genId(),
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      message: body.message,
      status: "unread",
      createdAt: new Date().toISOString(),
    };
    store.inquiries.push(inquiry);
    res.json({ id: inquiry.id });
  });

  app.put("/api/shops/:shopId/inquiries", async (req, res) => {
    const store = getBookingStore(req, res);
    if (!store) return;
    const body = req.body;
    const inquiry = store.inquiries.find((i) => i.id === body.id);
    if (inquiry && body.status) {
      inquiry.status = body.status;
    }
    res.json({ ok: true });
  });

  return httpServer;
}
