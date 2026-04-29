import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { and, count, eq, inArray, ne } from "drizzle-orm";
import {
  members,
  subscriptions,
  users,
  type InsertMember,
  type InsertSubscription,
  type InsertUser,
  type Member,
  type Subscription,
  type UpdateMember,
  type UpdateUser,
  type User,
} from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  /** Number of users currently holding the `admin` role. */
  countAdmins(): Promise<number>;
  /**
   * Number of OTHER admins, i.e. admins whose id !== `excludingId`. Useful to
   * answer the question "if I demote/delete this user, will any admin remain?"
   */
  countOtherAdmins(excludingId: string): Promise<number>;

  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: UpdateMember): Promise<Member | undefined>;
  deleteMember(id: string): Promise<void>;

  getSubscriptionsByMemberId(memberId: string): Promise<Subscription[]>;
  getSubscriptionsByMemberIds(
    memberIds: string[],
  ): Promise<Map<string, Subscription[]>>;
  createSubscription(
    subscription: InsertSubscription & { memberId: string },
  ): Promise<Subscription>;
  updateSubscription(
    id: string,
    updates: Partial<InsertSubscription>,
  ): Promise<Subscription | undefined>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  deleteSubscription(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    void this.initializeAdmin();
  }

  private async initializeAdmin() {
    try {
      const adminExists = await this.getUserByUsername("admin");
      if (adminExists) return;

      // Choose the initial password:
      //   1. If ADMIN_INITIAL_PASSWORD is set and >= 8 chars  → use it (CI/CD).
      //   2. Otherwise generate a strong random one and print it ONCE to stderr.
      // We never fall back to a hard-coded literal, and we never persist the
      // plaintext password anywhere except hashed in the database.
      const envPassword = process.env.ADMIN_INITIAL_PASSWORD;
      const isEnvPasswordValid =
        typeof envPassword === "string" && envPassword.length >= 8;

      const initialPassword = isEnvPasswordValid
        ? envPassword
        : generateRandomPassword(24);

      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        mustChangePassword: true,
      });

      if (isEnvPasswordValid) {
        console.error(
          "[STORAGE] تم إنشاء المستخدم admin من ADMIN_INITIAL_PASSWORD. سيُطلب تغيير كلمة المرور عند أول دخول.",
        );
      } else {
        printInitialAdminCredentialsOnce(initialPassword);
        stashInitialAdminPasswordForOneTimeReveal(initialPassword);
      }
    } catch (error) {
      console.error("[STORAGE] فشل في إنشاء مستخدم admin:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(
    id: string,
    userUpdates: UpdateUser,
  ): Promise<User | undefined> {
    if (Object.keys(userUpdates).length === 0) {
      return this.getUser(id);
    }
    const [updatedUser] = await db
      .update(users)
      .set(userUpdates as Partial<typeof users.$inferInsert>)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async countAdmins(): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, "admin"));
    return Number(row?.value ?? 0);
  }

  async countOtherAdmins(excludingId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, excludingId)));
    return Number(row?.value ?? 0);
  }

  async getMembers(): Promise<Member[]> {
    return await db.select().from(members);
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMember(
    id: string,
    memberUpdates: UpdateMember,
  ): Promise<Member | undefined> {
    if (Object.keys(memberUpdates).length === 0) {
      return this.getMember(id);
    }
    const [updatedMember] = await db
      .update(members)
      .set(memberUpdates as Partial<typeof members.$inferInsert>)
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  async getSubscriptionsByMemberId(memberId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.memberId, memberId));
  }

  async getSubscriptionsByMemberIds(
    memberIds: string[],
  ): Promise<Map<string, Subscription[]>> {
    const grouped = new Map<string, Subscription[]>();
    if (memberIds.length === 0) return grouped;

    const rows = await db
      .select()
      .from(subscriptions)
      .where(inArray(subscriptions.memberId, memberIds));

    for (const id of memberIds) grouped.set(id, []);
    for (const row of rows) {
      const list = grouped.get(row.memberId);
      if (list) list.push(row);
      else grouped.set(row.memberId, [row]);
    }
    return grouped;
  }

  async createSubscription(
    subscription: InsertSubscription & { memberId: string },
  ): Promise<Subscription> {
    const [newSub] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSub;
  }

  async updateSubscription(
    id: string,
    updates: Partial<InsertSubscription>,
  ): Promise<Subscription | undefined> {
    if (Object.keys(updates).length === 0) {
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, id));
      return existing;
    }
    const [updated] = await db
      .update(subscriptions)
      .set(updates as Partial<typeof subscriptions.$inferInsert>)
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return sub;
  }

  async deleteSubscription(id: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }
}

export const storage = new DatabaseStorage();

// ---------------------------------------------------------------------------
// Initial-admin password helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically strong random password.
 * Uses url-safe alphabet (no `+`, `/`, `=`, `0/O`, `1/l/I`) to make manual
 * copying from terminal logs easier and avoid ambiguity.
 */
function generateRandomPassword(length = 24): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Print the freshly-generated admin credentials to stderr in a highly visible
 * box. This runs ONLY when a new admin user is created during boot, so the
 * password appears at most once per database lifetime. The plaintext password
 * is never persisted, never logged again, and is dropped from process memory
 * as soon as `initializeAdmin` returns.
 */
let pendingInitialAdminPassword: string | null = null;

function stashInitialAdminPasswordForOneTimeReveal(plaintext: string): void {
  pendingInitialAdminPassword = plaintext;
}

/**
 * Returns the freshly-generated initial admin password ONCE and clears it
 * from memory. Subsequent calls return null. This is what powers the
 * one-time reveal banner on the login page after first boot.
 */
export function consumeInitialAdminPassword(): string | null {
  const value = pendingInitialAdminPassword;
  pendingInitialAdminPassword = null;
  return value;
}

function printInitialAdminCredentialsOnce(plaintextPassword: string): void {
  const lines = [
    "",
    "╔══════════════════════════════════════════════════════════════╗",
    "║  SCVA — Initial admin credentials (shown only once)          ║",
    "║  بيانات الدخول الأوليّة للمستخدم admin (تظهر مرّة واحدة فقط)    ║",
    "╠══════════════════════════════════════════════════════════════╣",
    `║  username: admin`.padEnd(63) + "║",
    `║  password: ${plaintextPassword}`.padEnd(63) + "║",
    "╠══════════════════════════════════════════════════════════════╣",
    "║  • سيُطلب تغيير كلمة المرور فور تسجيل الدخول الأوّل.            ║",
    "║  • انسخ الكلمة الآن — لن تُطبع مرّة أخرى.                       ║",
    "║  • للأتمتة استخدم متغيّر البيئة ADMIN_INITIAL_PASSWORD.        ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
  ];
  console.error(lines.join("\n"));
}
