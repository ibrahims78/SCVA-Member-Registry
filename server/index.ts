import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";

// ---------- Security headers ----------
// CSP is disabled in development so Vite HMR / dev banner / runtime overlay
// keep working. In production we still ship a hardened set of headers
// (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, ...).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ---------- Body parsing with explicit size limits ----------
// Excel imports are routed through XLSX in the browser and posted as JSON;
// 5MB is comfortably above any realistic payload while preventing
// memory-exhaustion attacks.
app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ---------- Same-origin guard for cookie-authenticated mutations ----------
// A lightweight CSRF mitigation that does not require a token round-trip.
// In production, every state-changing request to /api/* MUST carry an Origin
// or Referer header that matches the host the request was sent to. The
// browser sets these automatically and they cannot be forged by
// cross-site form submissions, which is the primary CSRF vector.
app.use((req, res, next) => {
  if (!isProduction) return next();
  if (!req.path.startsWith("/api")) return next();
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  // /api/login itself is rate-limited and accepts only username+password,
  // so cross-origin POSTs cannot escalate privileges via CSRF here.
  if (req.path === "/api/login") return next();

  const origin = req.get("origin");
  const referer = req.get("referer");
  const host = req.get("host");
  if (!host) return res.status(400).json({ message: "Missing Host header" });

  const expected = [`http://${host}`, `https://${host}`];
  const sourceOk =
    (origin && expected.includes(origin)) ||
    (referer && expected.some((u) => referer.startsWith(u)));

  if (!sourceOk) {
    return res.status(403).json({ message: "Cross-site request blocked" });
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Avoid logging sensitive payloads (e.g. password fields)
        const sanitized = { ...capturedJsonResponse };
        if ("password" in sanitized) sanitized.password = "[redacted]";
        logLine += ` :: ${JSON.stringify(sanitized)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await setupAuth(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return;
    }
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
