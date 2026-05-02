/**
 * Shared column definitions for Excel import/export.
 * Each column carries Arabic + English labels so:
 *  - Export uses whichever matches the current UI language.
 *  - Import accepts EITHER label regardless of current language.
 */

export interface ImportColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  exampleAr: string;
  exampleEn: string;
}

export const MEMBER_COLUMNS: ImportColumn[] = [
  { key: "firstName",      labelAr: "الاسم الأول *",            labelEn: "First name *",            exampleAr: "محمد",                exampleEn: "Mohammad" },
  { key: "lastName",       labelAr: "الكنية *",                 labelEn: "Last name *",             exampleAr: "الأحمد",              exampleEn: "Al-Ahmad" },
  { key: "fullName",       labelAr: "الاسم بالعربية",           labelEn: "Full name (Arabic)",      exampleAr: "محمد علي الأحمد",     exampleEn: "محمد علي الأحمد" },
  { key: "fatherName",     labelAr: "اسم الأب",                 labelEn: "Father's name",           exampleAr: "علي",                 exampleEn: "Ali" },
  { key: "englishName",    labelAr: "الاسم بالإنجليزية",        labelEn: "Full name (English)",     exampleAr: "Mohammad Al-Ahmad",   exampleEn: "Mohammad Al-Ahmad" },
  { key: "birthDate",      labelAr: "تاريخ الميلاد",            labelEn: "Date of birth",           exampleAr: "1985-06-15",          exampleEn: "1985-06-15" },
  { key: "gender",         labelAr: "الجنس",                    labelEn: "Gender",                  exampleAr: "male",                exampleEn: "male" },
  { key: "specialty",      labelAr: "التخصص",                   labelEn: "Specialty",               exampleAr: "cardiology",          exampleEn: "cardiology" },
  { key: "email",          labelAr: "البريد الإلكتروني",        labelEn: "Email",                   exampleAr: "example@email.com",   exampleEn: "example@email.com" },
  { key: "phone",          labelAr: "رقم الهاتف",               labelEn: "Phone",                   exampleAr: "0911234567",          exampleEn: "0911234567" },
  { key: "city",           labelAr: "المدينة",                  labelEn: "City",                    exampleAr: "دمشق",                exampleEn: "Damascus" },
  { key: "workAddress",    labelAr: "عنوان العمل",              labelEn: "Work address",            exampleAr: "مستشفى المجتهد",      exampleEn: "Al-Mojtahed Hospital" },
  { key: "joinDate",       labelAr: "تاريخ الانضمام",           labelEn: "Join date",               exampleAr: "2020-01-01",          exampleEn: "2020-01-01" },
  { key: "membershipType", labelAr: "نوع العضوية",              labelEn: "Membership type",         exampleAr: "original",            exampleEn: "original" },
  { key: "escId",          labelAr: "معرّف الجمعية الأوروبية",  labelEn: "ESC ID",                  exampleAr: "",                    exampleEn: "" },
];

export const SUBSCRIPTION_COLUMNS: ImportColumn[] = [
  { key: "membershipNumber", labelAr: "رقم العضوية",     labelEn: "Membership number",   exampleAr: "1",          exampleEn: "1" },
  { key: "firstName",        labelAr: "الاسم الأول",     labelEn: "First name",          exampleAr: "محمد",       exampleEn: "Mohammad" },
  { key: "lastName",         labelAr: "الكنية",          labelEn: "Last name",           exampleAr: "الأحمد",     exampleEn: "Al-Ahmad" },
  { key: "year",             labelAr: "سنة الاشتراك *",  labelEn: "Subscription year *", exampleAr: "2024",       exampleEn: "2024" },
  { key: "amount",           labelAr: "المبلغ (ل.س) *",  labelEn: "Amount (SYP) *",      exampleAr: "50000",      exampleEn: "50000" },
  { key: "date",             labelAr: "تاريخ الدفع *",   labelEn: "Payment date *",      exampleAr: "2024-03-15", exampleEn: "2024-03-15" },
  { key: "notes",            labelAr: "ملاحظات",         labelEn: "Notes",               exampleAr: "دُفع نقداً", exampleEn: "Paid in cash" },
];

/**
 * Build a column-key → column-index map from a raw header row.
 * Accepts BOTH Arabic and English labels (trimmed, case-insensitive).
 */
export function buildHeaderIndex(
  headerRow: unknown[],
  columns: ImportColumn[],
): Record<string, number> {
  const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s*\*/g, "");
  const headers = headerRow.map(normalize);
  const map: Record<string, number> = {};
  for (const col of columns) {
    const candidates = [normalize(col.labelAr), normalize(col.labelEn)];
    const idx = headers.findIndex((h) => candidates.includes(h));
    if (idx !== -1) map[col.key] = idx;
  }
  return map;
}
