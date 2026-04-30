import type { Request } from "express";

/**
 * Tiny server-side i18n.
 *
 * The browser sends `X-UI-Lang: ar|en` (and a matching `Accept-Language`)
 * on every request, mirroring the language the user has selected in the
 * UI. We default to Arabic so legacy clients and unauthenticated calls
 * keep their original copy.
 *
 * Usage:
 *   import { t } from "./i18n";
 *   res.status(400).json({ message: t(req, "invalidData") });
 */

type LangCode = "ar" | "en";

const dict = {
  ar: {
    invalidData:        "بيانات غير صالحة",
    usernameTaken:      "اسم المستخدم مستخدم مسبقاً",
    cantDemoteLastAdmin:"لا يمكن تنزيل دور آخر مدير في النظام. أنشئ مديراً آخر أوّلاً ثم أعد المحاولة.",
    cantDeleteSelf:     "لا يمكنك حذف حسابك الخاص",
    cantDeleteLastAdmin:"لا يمكن حذف آخر مدير في النظام. أنشئ مديراً آخر أوّلاً ثم أعد المحاولة.",
    noImportRows:       "لا توجد بيانات للاستيراد",
    memberNotFound:     "لم يُعثر على العضو في قاعدة البيانات",
    subUpdateFailed:    "فشل تحديث الاشتراك",
    dbSaveFailed:       "فشل الحفظ في قاعدة البيانات",
    rowPrefix:          "الصف",
    failUpdate:         "فشل تحديث",
    failSave:           "فشل حفظ",
    pdfNotAvailable:    "خاصيّة تصدير PDF غير متاحة على الخادم حالياً. يُرجى استخدام تصدير Word كبديل، أو الاتّصال بالمسؤول التقنيّ لتثبيت متصفّح Chromium.",
    pdfGenerationFailed:"تعذّر توليد ملفّ PDF. حاول لاحقاً أو استخدم تصدير Word.",
    badCredentials:     "اسم المستخدم أو كلمة المرور غير صحيحة",
    tooManyAttempts:    "تجاوزت عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد 15 دقيقة.",
  },
  en: {
    invalidData:        "Invalid data",
    usernameTaken:      "Username is already taken",
    cantDemoteLastAdmin:"You cannot demote the last admin. Create another admin first, then retry.",
    cantDeleteSelf:     "You cannot delete your own account",
    cantDeleteLastAdmin:"You cannot delete the last admin. Create another admin first, then retry.",
    noImportRows:       "No data to import",
    memberNotFound:     "Member not found in the database",
    subUpdateFailed:    "Failed to update payment",
    dbSaveFailed:       "Failed to save to database",
    rowPrefix:          "Row",
    failUpdate:         "Failed to update",
    failSave:           "Failed to save",
    pdfNotAvailable:    "PDF export is currently unavailable on the server. Please use Word export instead, or contact the technical administrator to install Chromium.",
    pdfGenerationFailed:"Could not generate PDF file. Try again later or use Word export.",
    badCredentials:     "Incorrect username or password",
    tooManyAttempts:    "You have exceeded the allowed number of login attempts. Please try again after 15 minutes.",
  },
} as const;

export type MsgKey = keyof typeof dict["ar"];

export function getLang(req: Request): LangCode {
  const header =
    (req.header("x-ui-lang") || req.header("accept-language") || "")
      .toLowerCase()
      .trim();
  if (header.startsWith("en")) return "en";
  return "ar";
}

export function t(req: Request, key: MsgKey): string {
  const lang = getLang(req);
  return dict[lang][key] ?? dict.ar[key];
}
