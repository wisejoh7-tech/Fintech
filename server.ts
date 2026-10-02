import express from "express";
import "dotenv/config";
import path from "path";
import { createServer as createHttpServer } from "http";
import { createServer as createViteServer } from "vite";
import { SocketService } from "./backend/services/SocketService";
import { VaultService } from "./backend/services/VaultService";
import { rateLimiter } from "./backend/middleware/RateLimiter";
import apiRoutes from "./backend/routes/index";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Monitoring
import { initMonitoring } from "./backend/monitoring/Sentry";
import "./backend/workers/TransferWorker";

// Global BigInt JSON serialization fix
(BigInt.prototype as any).toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'vivabanking',
      });
      console.log("Firebase Admin initialized with service account.");
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'vivabanking',
      });
      console.log("Firebase Admin initialized with application default credentials.");
    }
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err);
  }
}

async function startServer() {
  initMonitoring();

  setInterval(() => {
    VaultService.applyDailyInterest().catch(err => console.error("Interest calculation failed:", err));
  }, 24 * 60 * 60 * 1000);

  const app = express();
  const httpServer = createHttpServer(app);
  const io = SocketService.init(httpServer);
  const PORT = process.env.PORT || 3000;

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // CORS and Security Headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(rateLimiter);

  // Mount API Routes
  app.use("/api", apiRoutes);

  // Serve Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
startServer();
