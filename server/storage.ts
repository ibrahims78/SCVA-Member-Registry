import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
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
  createSubscription(
    subscription: InsertSubscription & { memberId: string },
  ): Promise<Subscription>;
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
      console.log(
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

  async createSubscription(
    subscription: InsertSubscription & { memberId: string },
  ): Promise<Subscription> {
    const [newSub] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSub;
  }
}

export const storage = new DatabaseStorage();
