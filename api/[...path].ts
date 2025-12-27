import "dotenv/config";

import express from "express";

import { registerAuthRoutes } from "../server/auth-routes";
import { registerRoutes } from "../server/routes";
import { registerTrackingRoutes } from "../server/tracking-routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let app: ReturnType<typeof express> | undefined;
let initialized: Promise<void> | undefined;

async function getApp() {
  if (app) return app;

  app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  initialized = (async () => {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      registerAuthRoutes(app!);
    }

    if (process.env.TRACKING_API_KEY) {
      registerTrackingRoutes(app!);
    }

    await registerRoutes(undefined, app!);

    app!.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
  })();

  await initialized;
  return app;
}

export default async function handler(req: any, res: any) {
  const server = await getApp();
  return server(req as any, res as any);
}
