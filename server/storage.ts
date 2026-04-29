import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
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

      const defaultPassword =
        process.env.ADMIN_INITIAL_PASSWORD || "12345678";

      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
        mustChangePassword: true,
      });
      // Use stderr for diagnostics so production log collectors pick it up
      // alongside other startup messages, while not polluting stdout streams
      // used by structured loggers.
      console.error(
        "[STORAGE] تم إنشاء مستخدم admin الافتراضي. سيُطلب تغيير كلمة المرور عند أول تسجيل دخول.",
      );
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
