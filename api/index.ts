import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createServer } from "http";
import type { Request, Response, NextFunction } from "express";

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export const httpServer = createServer(app);

let _setup: Promise<void> | null = null;

export function ensureSetup(): Promise<void> {
  if (!_setup) {
    _setup = (async () => {
      const { runMigrations } = await import("../server/migrate");
      await runMigrations();

      const { seedDatabase } = await import("../server/seed");
      await seedDatabase();

      const { registerRoutes } = await import("../server/routes");
      await registerRoutes(httpServer, app);

      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error("Internal Server Error:", err);
        if (res.headersSent) return next(err);
        return res.status(status).json({ message });
      });
    })();
  }
  return _setup;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSetup();
  return app(req as any, res as any);
}
