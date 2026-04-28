import { type User, type InsertUser, type Member, type Subscription } from "@shared/schema.ts";
import { members, subscriptions, users } from "@shared/schema.ts";
import { db } from "./db.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; // إضافة مكتبة التشفير

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Member methods
  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  createMember(member: any): Promise<Member>;
  updateMember(id: string, member: any): Promise<Member | undefined>;
  deleteMember(id: string): Promise<void>;
  
  // Subscription methods
  getSubscriptionsByMemberId(memberId: string): Promise<Subscription[]>;
  createSubscription(subscription: any): Promise<Subscription>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // تشغيل وظيفة التحقق من وجود المدير عند بدء التشغيل
    this.initializeAdmin();
  }

  async initializeAdmin() {
    try {
      const adminExists = await this.getUserByUsername("admin");
      if (!adminExists) {
        console.log("[STORAGE] مستخدم admin غير موجود، يتم إنشاؤه الآن...");
        const hashedPassword = await bcrypt.hash("123456", 10);
        await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          role: "admin",
        });
        console.log("[STORAGE] تم إنشاء مستخدم admin الافتراضي بنجاح.");
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, userUpdates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userUpdates)
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

  async createMember(member: any): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMember(id: string, memberUpdates: any): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(members)
      .set(memberUpdates)
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  async getSubscriptionsByMemberId(memberId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.memberId, memberId));
  }

  async createSubscription(subscription: any): Promise<Subscription> {
    const [newSub] = await db.insert(subscriptions).values(subscription).returning();
    return newSub;
  }
}

export const storage = new DatabaseStorage();