import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // "admin" or "employee"
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(),
  fatherName: text("father_name").notNull(),
  englishName: text("english_name").notNull(),
  birthDate: text("birth_date").notNull(),
  gender: text("gender").notNull(),
  specialty: text("specialty").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  workAddress: text("work_address").notNull(),
  city: text("city").notNull(),
  joinDate: text("join_date").notNull(),
  membershipType: text("membership_type").notNull(),
  escId: text("esc_id"),
  membershipNumber: integer("membership_number").generatedAlwaysAsIdentity(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  year: text("year").notNull(),
  amount: text("amount").notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
});

export const insertMemberSchema = createInsertSchema(members);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

