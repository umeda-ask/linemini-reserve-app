import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

// ルート登録（モジュールロード時に1度だけ実行）
const routesReady = registerRoutes(httpServer, app);

export { app };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await routesReady;
  return app(req as any, res as any);
}
