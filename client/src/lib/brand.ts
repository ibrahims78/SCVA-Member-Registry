/**
 * SCVA Brand Constants
 * Single source of truth for brand naming and copy.
 */

export const BRAND = {
  /** Short, used in tight spaces (sidebar header, breadcrumbs). */
  shortName: "SCVA",
  /** Full Arabic name. */
  fullNameAr: "الرابطة السورية لأمراض وجراحة القلب",
  /** Full English name. */
  fullNameEn: "Syrian Cardiovascular Association",
  /** App title — what users call this product. */
  productNameAr: "نظام إدارة الأعضاء",
  productNameEn: "Members Management System",
  /** One-sentence value statement (login screen, marketing surfaces). */
  taglineAr: "منصّة احترافية لإدارة عضويّة الأطباء بأمان وسهولة",
  taglineEn: "A professional platform to manage physician membership with security and ease",
  /** Founded / branding year — used in footers, certificates. */
  year: new Date().getFullYear(),
} as const;

export type Brand = typeof BRAND;
