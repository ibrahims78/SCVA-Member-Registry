import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name"),
  fatherName: text("father_name"),
  englishName: text("english_name"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  specialty: text("specialty"),
  email: text("email"),
  phone: text("phone"),
  workAddress: text("work_address"),
  city: text("city"),
  joinDate: text("join_date"),
  membershipType: text("membership_type"),
  escId: text("esc_id"),
  membershipNumber: integer("membership_number").generatedAlwaysAsIdentity(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").references(() => members.id).notNull(),
  year: integer("year").notNull(),
  amount: integer("amount").notNull(),
  notes: text("notes"),
  date: text("date").notNull(),
});

export const genderEnum = z.enum(["male", "female"]);
export const membershipTypeEnum = z.enum(["original", "associate"]);

export const insertUserSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يحتوي 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي 6 أحرف على الأقل"),
  role: z.enum(["admin", "employee"]).optional(),
});

export const updateUserSchema = z
  .object({
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["admin", "employee"]).optional(),
  })
  .strict();

export const insertMemberSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الكنية مطلوبة"),
  fullName: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  englishName: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: genderEnum.optional().nullable(),
  specialty: z.string().optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  workAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  membershipType: membershipTypeEnum.optional().nullable(),
  escId: z.string().optional().nullable(),
});

export const updateMemberSchema = insertMemberSchema.partial();

export const insertSubscriptionSchema = z.object({
  year: z.coerce.number().int().min(1900).max(3000),
  amount: z.coerce.number().int().nonnegative(),
  notes: z.string().optional().nullable(),
  date: z.string().min(1, "التاريخ مطلوب"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type UpdateMember = z.infer<typeof updateMemberSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Gender = z.infer<typeof genderEnum>;
export type MembershipType = z.infer<typeof membershipTypeEnum>;

export type MemberWithSubscriptions = Member & {
  subscriptions: Subscription[];
};

export const SPECIALTIES = [
  { value: "cardiac_surgery", labelAr: "جراحة قلب", labelEn: "Cardiac Surgery" },
  { value: "cardiology", labelAr: "قلبية داخلية", labelEn: "Cardiology" },
] as const;

export const GENDERS = [
  { value: "male", labelAr: "ذكر", labelEn: "Male" },
  { value: "female", labelAr: "أنثى", labelEn: "Female" },
] as const;

export const MEMBERSHIP_TYPES = [
  { value: "original", labelAr: "أصيل", labelEn: "Original" },
  { value: "associate", labelAr: "مشارك", labelEn: "Associate" },
] as const;
