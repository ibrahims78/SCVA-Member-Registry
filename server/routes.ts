import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import puppeteer from "puppeteer-core";
import * as ChromeLauncher from "chrome-launcher";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware to protect API routes
  app.use("/api", (req, res, next) => {
    if (req.path === "/login" || req.path === "/logout" || req.path === "/user" || req.path.endsWith("/pdf")) {
      return next();
    }
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });

  // User management routes (Admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const { username, password, role } = req.body;
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || "employee",
      });
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const updates = { ...req.body };
      if (updates.password) {
        const bcrypt = await import("bcryptjs");
        updates.password = await bcrypt.default.hash(updates.password, 10);
      }
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteUser(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/members/:id/pdf", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) return res.status(404).json({ message: "Member not found" });

      const chromePath = process.env.CHROME_PATH || "/usr/bin/chromium";

      const browser = await puppeteer.launch({
        executablePath: chromePath,
        args: [
          "--no-sandbox", 
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage" 
        ],
      });

      const page = await browser.newPage();
      
      const cookies = req.headers.cookie?.split(';').map(c => {
        const [name, ...value] = c.trim().split('=');
        return {
          name,
          value: value.join('='),
          domain: "localhost", // تعديل الدومين ليتوافق مع الاتصال المحلي
          path: '/',
          httpOnly: true,
          secure: false // تغيير لـ false لأننا نتصل بـ http محلي
        };
      }) || [];
      await page.setCookie(...cookies);
      
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      const logoPath = path.join(__dirname, '../client/src/assets/logo.base64.txt');
      const logoBase64Content = fs.readFileSync(logoPath, 'utf8').trim();
      const logoBase64 = `data:image/jpeg;base64,${logoBase64Content}`;

      // التعديل الأساسي هنا: الاتصال بـ localhost مباشرة لتجاوز مشاكل Cloudflare
      const memberUrl = `http://localhost:5000/member/${req.params.id}?print=true`;

      await page.goto(memberUrl, { waitUntil: "networkidle0" });
      
      await page.evaluate((logo: string) => {
        const style = document.createElement('style');
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

        const header = document.createElement('div');
        header.className = 'pdf-header';
        header.innerHTML = `
          <img src="${logo}" class="pdf-logo" />
          <div class="pdf-title">
            <h2 style="margin:0; color:black;">الرابطة السورية لأمراض وجراحة القلب</h2>
            <p style="margin:5px 0 0 0; color:black;">Syrian Cardiovascular Association</p>
          </div>
          <div style="width: 80px;"></div>
        `;
        
        const content = document.getElementById('member-report-content');
        if (content) { content.insertBefore(header, content.firstChild); }
      }, logoBase64);
      
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      await browser.close();
      res.contentType("application/pdf");
      res.send(pdf);
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
  });

  app.get("/api/members", async (_req, res) => {
    const members = await storage.getMembers();
    const membersWithSubs = await Promise.all(
      members.map(async (member) => {
        const subs = await storage.getSubscriptionsByMemberId(member.id);
        return { ...member, subscriptions: subs };
      })
    );
    res.json(membersWithSubs);
  });

  app.get("/api/members/:id", async (req, res) => {
    const member = await storage.getMember(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    const subs = await storage.getSubscriptionsByMemberId(member.id);
    res.json({ ...member, subscriptions: subs });
  });

  app.post("/api/members", async (req, res) => {
    try {
      const member = await storage.createMember(req.body);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create member", error: error.message });
    }
  });

  app.patch("/api/members/:id", async (req, res) => {
    const member = await storage.updateMember(req.params.id, req.body);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  });

  app.delete("/api/members/:id", async (req, res) => {
    await storage.deleteMember(req.params.id);
    res.sendStatus(204);
  });

  app.post("/api/members/:id/subscriptions", async (req, res) => {
    const sub = await storage.createSubscription({
      ...req.body,
      memberId: req.params.id,
    });
    res.status(201).json(sub);
  });

  return httpServer;
}