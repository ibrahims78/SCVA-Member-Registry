import type { Express, NextFunction, Request, Response } from "express";
import { type Server } from "http";
import { z } from "zod";
import puppeteer from "puppeteer-core";
import { storage } from "./storage";
import {
  insertMemberSchema,
  insertSubscriptionSchema,
  insertUserSchema,
  updateMemberSchema,
  updateUserSchema,
} from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : (id as string);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function handleZodError(res: Response, error: z.ZodError) {
  return res
    .status(400)
    .json({ message: "بيانات غير صالحة", errors: error.flatten().fieldErrors });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ---------- Users (admin only) ----------
  app.get("/api/users", requireAdmin, async (_req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(({ password, ...rest }) => rest));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/users", requireAdmin, async (req, res, next) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return handleZodError(res, parsed.error);
    try {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash(parsed.data.password, 10);
      const user = await storage.createUser({
        username: parsed.data.username,
        password: hashedPassword,
        role: parsed.data.role ?? "employee",
      });
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ message: "اسم المستخدم مستخدم مسبقاً" });
      }
      next(err);
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res, next) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return handleZodError(res, parsed.error);
    try {
      const updates: Record<string, unknown> = { ...parsed.data };
      if (typeof updates.password === "string") {
        const bcrypt = await import("bcryptjs");
        updates.password = await bcrypt.default.hash(updates.password, 10);
      }
      const user = await storage.updateUser(paramId(req), updates as any);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res, next) => {
    try {
      if (req.user?.id === paramId(req)) {
        return res
          .status(400)
          .json({ message: "لا يمكنك حذف حسابك الخاص" });
      }
      await storage.deleteUser(paramId(req));
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // ---------- Members ----------
  app.get("/api/members", requireAuth, async (_req, res, next) => {
    try {
      const members = await storage.getMembers();
      const membersWithSubs = await Promise.all(
        members.map(async (member) => {
          const subs = await storage.getSubscriptionsByMemberId(member.id);
          return { ...member, subscriptions: subs };
        }),
      );
      res.json(membersWithSubs);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/members/:id", requireAuth, async (req, res, next) => {
    try {
      const member = await storage.getMember(paramId(req));
      if (!member) return res.status(404).json({ message: "Member not found" });
      const subs = await storage.getSubscriptionsByMemberId(member.id);
      res.json({ ...member, subscriptions: subs });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/members", requireAuth, async (req, res, next) => {
    const parsed = insertMemberSchema.safeParse(req.body);
    if (!parsed.success) return handleZodError(res, parsed.error);
    try {
      const member = await storage.createMember(parsed.data);
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/members/:id", requireAuth, async (req, res, next) => {
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) return handleZodError(res, parsed.error);
    try {
      const member = await storage.updateMember(paramId(req), parsed.data);
      if (!member) return res.status(404).json({ message: "Member not found" });
      res.json(member);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/members/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteMember(paramId(req));
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  app.post(
    "/api/members/:id/subscriptions",
    requireAuth,
    async (req, res, next) => {
      const parsed = insertSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) return handleZodError(res, parsed.error);
      try {
        const member = await storage.getMember(paramId(req));
        if (!member) {
          return res.status(404).json({ message: "Member not found" });
        }
        const sub = await storage.createSubscription({
          ...parsed.data,
          memberId: paramId(req),
        });
        res.status(201).json(sub);
      } catch (err) {
        next(err);
      }
    },
  );

  // ---------- Member PDF ----------
  // Now requires authentication. Uses puppeteer-core; requires Chromium to be
  // available at CHROME_PATH (defaults to /usr/bin/chromium).
  app.get("/api/members/:id/pdf", requireAuth, async (req, res) => {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
    try {
      const member = await storage.getMember(paramId(req));
      if (!member) return res.status(404).json({ message: "Member not found" });

      const chromePath = process.env.CHROME_PATH || "/usr/bin/chromium";

      browser = await puppeteer.launch({
        executablePath: chromePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

      const page = await browser.newPage();

      const cookies = (req.headers.cookie?.split(";") ?? [])
        .map((c) => {
          const [name, ...value] = c.trim().split("=");
          if (!name) return null;
          return {
            name,
            value: value.join("="),
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
      }

      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const logoPath = path.join(
        __dirname,
        "../client/src/assets/logo.base64.txt",
      );
      const logoBase64Content = fs.readFileSync(logoPath, "utf8").trim();
      const logoBase64 = `data:image/jpeg;base64,${logoBase64Content}`;

      const port = process.env.PORT || "5000";
      const memberUrl = `http://localhost:${port}/member/${paramId(req)}?print=true`;

      await page.goto(memberUrl, { waitUntil: "networkidle0" });

      await page.evaluate((logo: string) => {
        const style = document.createElement("style");
        style.textContent = `
          #replit-dev-banner, .replit-watermark, [class*="replit"], [id*="replit"] {
            display: none !important;
          }
          * { color: black !important; -webkit-print-color-adjust: exact; }
          @media print {
            .pdf-header { display: flex !important; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
            .pdf-logo { width: 80px; height: 80px; object-fit: contain; }
            .pdf-title { text-align: center; flex-grow: 1; }
          }
        `;
        document.head.appendChild(style);

        const header = document.createElement("div");
        header.className = "pdf-header";
        header.innerHTML = `
          <img src="${logo}" class="pdf-logo" />
          <div class="pdf-title">
            <h2 style="margin:0; color:black;">الرابطة السورية لأمراض وجراحة القلب</h2>
            <p style="margin:5px 0 0 0; color:black;">Syrian Cardiovascular Association</p>
          </div>
          <div style="width: 80px;"></div>
        `;

        const content = document.getElementById("member-report-content");
        if (content) content.insertBefore(header, content.firstChild);
      }, logoBase64);

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      res.contentType("application/pdf");
      res.send(pdf);
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error?.message ?? String(error),
      });
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  });

  return httpServer;
}
