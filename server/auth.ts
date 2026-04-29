import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { pool } from "./db";
import { loginSchema, type User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProduction) {
      throw new Error(
        "SESSION_SECRET environment variable must be set in production",
      );
    }
    console.warn(
      "[AUTH] SESSION_SECRET is not set. Using a generated dev-only secret. " +
        "Set SESSION_SECRET in your environment for stable sessions.",
    );
  }

  const PgSession = connectPgSimple(session);

  const sessionSettings: session.SessionOptions = {
    secret:
      sessionSecret ||
      // Random per-process fallback for development only
      Math.random().toString(36).slice(2) + Date.now().toString(36),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
  };

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return done(null, false, {
            message: "اسم المستخدم أو كلمة المرور غير صحيحة",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message:
        "تجاوزت عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد 15 دقيقة.",
    },
    skip: () => process.env.NODE_ENV === "test",
  });

  app.post("/api/login", loginLimiter, (req: Request, res: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "بيانات غير صالحة" });
    }
    passport.authenticate("local", (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie("connect.sid");
        res.sendStatus(204);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
  });
}
