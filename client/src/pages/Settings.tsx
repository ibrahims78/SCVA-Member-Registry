import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import {
  Loader2, UserPlus, Pencil, Trash2, ShieldCheck,
  FileSpreadsheet, Download, Upload, DatabaseBackup,
  CheckCircle2, AlertCircle, X, Receipt,
} from "lucide-react";
import { useState, useRef } from "react";
import { z } from "zod";
import * as XLSX from "xlsx";

function buildUserSchema(isAr: boolean) {
  return insertUserSchema.extend({
    password: z
      .string()
      .min(
        6,
        isAr
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
      )
      .optional()
      .or(z.literal("")),
    role: z.enum(["admin", "employee"]),
  });
}
type UserFormValues = z.infer<ReturnType<typeof buildUserSchema>>;

// Each column carries both Arabic and English labels. The downloaded template
// uses the label that matches the current UI language so users can prepare
// the file in whichever language they prefer. The import parser accepts EITHER
// label, which keeps backward compatibility with files prepared earlier
// (when the template was Arabic-only) and lets a user import a file that was
// authored in a different language than the current UI.
interface ImportColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  exampleAr: string;
  exampleEn: string;
}

const IMPORT_COLUMNS: ImportColumn[] = [
  { key: "firstName",      labelAr: "الاسم الأول *",          labelEn: "First name *",            exampleAr: "محمد",                exampleEn: "Mohammad" },
  { key: "lastName",       labelAr: "الكنية *",               labelEn: "Last name *",             exampleAr: "الأحمد",              exampleEn: "Al-Ahmad" },
  { key: "fullName",       labelAr: "الاسم بالعربية",         labelEn: "Full name (Arabic)",      exampleAr: "محمد علي الأحمد",     exampleEn: "محمد علي الأحمد" },
  { key: "fatherName",     labelAr: "اسم الأب",               labelEn: "Father's name",           exampleAr: "علي",                 exampleEn: "Ali" },
  { key: "englishName",    labelAr: "الاسم بالإنجليزية",      labelEn: "Full name (English)",     exampleAr: "Mohammad Al-Ahmad",   exampleEn: "Mohammad Al-Ahmad" },
  { key: "birthDate",      labelAr: "تاريخ الميلاد",          labelEn: "Date of birth",           exampleAr: "1985-06-15",          exampleEn: "1985-06-15" },
  { key: "gender",         labelAr: "الجنس",                  labelEn: "Gender",                  exampleAr: "male",                exampleEn: "male" },
  { key: "specialty",      labelAr: "التخصص",                 labelEn: "Specialty",               exampleAr: "cardiology",          exampleEn: "cardiology" },
  { key: "email",          labelAr: "البريد الإلكتروني",      labelEn: "Email",                   exampleAr: "example@email.com",   exampleEn: "example@email.com" },
  { key: "phone",          labelAr: "رقم الهاتف",             labelEn: "Phone",                   exampleAr: "0911234567",          exampleEn: "0911234567" },
  { key: "city",           labelAr: "المدينة",                labelEn: "City",                    exampleAr: "دمشق",                exampleEn: "Damascus" },
  { key: "workAddress",    labelAr: "عنوان العمل",            labelEn: "Work address",            exampleAr: "مستشفى المجتهد",      exampleEn: "Al-Mojtahed Hospital" },
  { key: "joinDate",       labelAr: "تاريخ الانضمام",         labelEn: "Join date",               exampleAr: "2020-01-01",          exampleEn: "2020-01-01" },
  { key: "membershipType", labelAr: "نوع العضوية",            labelEn: "Membership type",         exampleAr: "original",            exampleEn: "original" },
  { key: "escId",          labelAr: "معرّف الجمعية الأوروبية",labelEn: "ESC ID",                  exampleAr: "",                    exampleEn: "" },
];

const SUB_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "membershipNumber", labelAr: "رقم العضوية",    labelEn: "Membership number",  exampleAr: "1",          exampleEn: "1" },
  { key: "firstName",        labelAr: "الاسم الأول",    labelEn: "First name",         exampleAr: "محمد",       exampleEn: "Mohammad" },
  { key: "lastName",         labelAr: "الكنية",         labelEn: "Last name",          exampleAr: "الأحمد",     exampleEn: "Al-Ahmad" },
  { key: "year",             labelAr: "سنة الاشتراك *", labelEn: "Subscription year *",exampleAr: "2024",       exampleEn: "2024" },
  { key: "amount",           labelAr: "المبلغ (ل.س) *", labelEn: "Amount (SYP) *",     exampleAr: "50000",      exampleEn: "50000" },
  { key: "date",             labelAr: "تاريخ الدفع *",  labelEn: "Payment date *",     exampleAr: "2024-03-15", exampleEn: "2024-03-15" },
  { key: "notes",            labelAr: "ملاحظات",        labelEn: "Notes",              exampleAr: "دُفع نقداً", exampleEn: "Paid in cash" },
];

// Build a header -> column key lookup that accepts BOTH the Arabic and English
// labels (trimmed, case-insensitive). This is what makes a file prepared in
// one language importable while the UI is set to the other.
function buildHeaderIndex(
  headerRow: unknown[],
  columns: ImportColumn[],
): Record<string, number> {
  const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const headers = headerRow.map(normalize);
  const map: Record<string, number> = {};
  for (const col of columns) {
    const candidates = [normalize(col.labelAr), normalize(col.labelEn)];
    const idx = headers.findIndex((h) => candidates.includes(h));
    if (idx !== -1) map[col.key] = idx;
  }
  return map;
}

interface ImportResult {
  success: number;
  failed: number;
  skipped?: number;
  updated?: number;
  errors: string[];
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // ---- Localised UI strings ----
  const L = {
    title:        isAr ? "إعدادات النظام" : "System settings",
    subtitle:     isAr ? "إدارة المستخدمين، استيراد البيانات، والنسخ الاحتياطي." : "Manage users, import data, and backups.",
    success:      isAr ? "تم النجاح" : "Success",
    error:        isAr ? "خطأ" : "Error",
    // Users
    usersTitle:   isAr ? "إدارة المستخدمين" : "User management",
    usersDesc:    isAr ? "إضافة وتعديل وحذف حسابات النظام." : "Add, edit, or remove system accounts.",
    addUser:      isAr ? "إضافة مستخدم" : "Add user",
    username:     isAr ? "اسم المستخدم" : "Username",
    role:         isAr ? "الدور" : "Role",
    actions:      isAr ? "الإجراءات" : "Actions",
    admin:        isAr ? "مدير" : "Admin",
    employee:     isAr ? "موظف" : "Employee",
    cantDelSelf:  isAr ? "لا يمكنك حذف حسابك الخاصّ" : "You cannot delete your own account",
    cantDelLast:  isAr ? "لا يمكن حذف آخر مدير في النظام" : "You cannot delete the last admin",
    delUser:      isAr ? "حذف المستخدم" : "Delete user",
    confirmDel:   isAr ? "هل أنت متأكد من حذف هذا المستخدم؟" : "Are you sure you want to delete this user?",
    addUserOk:    isAr ? "تم إضافة المستخدم بنجاح" : "User added successfully",
    updUserOk:    isAr ? "تم تحديث بيانات المستخدم" : "User updated",
    delUserOk:    isAr ? "تم حذف المستخدم" : "User deleted",
    editUser:     isAr ? "تعديل مستخدم" : "Edit user",
    addUserNew:   isAr ? "إضافة مستخدم جديد" : "Add new user",
    pwd:          isAr ? "كلمة المرور" : "Password",
    pwdEdit:      isAr ? "كلمة مرور جديدة (اتركها فارغة لعدم التغيير)" : "New password (leave blank to keep current)",
    pickRole:     isAr ? "اختر الدور" : "Select role",
    save:         isAr ? "تحديث" : "Update",
    add:          isAr ? "إضافة" : "Add",
    // Imports
    impMembers:   isAr ? "استيراد بيانات الأعضاء" : "Import members",
    impMembersD:  isAr ? "رفع ملف Excel يحتوي على بيانات الأعضاء لإضافتهم دفعةً واحدة." : "Upload an Excel file with member data to add them in bulk.",
    steps:        isAr ? "الخطوات:" : "Steps:",
    step1:        isAr ? "حمّل نموذج Excel الرسمي بالضغط على الزر أدناه." : "Download the official Excel template using the button below.",
    step2:        isAr ? "أدخل بيانات الأعضاء في الملف (الاسم الأول والكنية إلزاميان، باقي الحقول اختيارية)." : "Fill in the member data (first and last name are required, the rest are optional).",
    step3:        isAr ? "ارفع الملف المعبّأ لبدء الاستيراد التلقائي." : "Upload the completed file to start the automatic import.",
    dlTemplate:   isAr ? "تحميل نموذج Excel" : "Download Excel template",
    importing:    isAr ? "جارٍ الاستيراد..." : "Importing...",
    uploadFile:   isAr ? "رفع ملف الاستيراد" : "Upload import file",
    updExisting:  isAr ? "تحديث بيانات الأعضاء الموجودين" : "Update existing members",
    updExHelp:    isAr ? "عند تفعيله، يُحدِّث بيانات أي عضو يتطابق اسمه (الأول + الكنية) بدلاً من تجاهله." : "When enabled, updates any member whose name (first + last) matches instead of skipping it.",
    importRes:    isAr ? "نتائج الاستيراد" : "Import results",
    succeeded:    isAr ? "تمّ بنجاح:" : "Succeeded:",
    failed:       isAr ? "فشل:" : "Failed:",
    updated:      isAr ? "تمّ التحديث:" : "Updated:",
    skipped:      isAr ? "تمّ تجاهل (موجود مسبقاً):" : "Skipped (already exists):",
    emptyFile:    isAr ? "الملف فارغ" : "Empty file",
    noData:       isAr ? "لا توجد بيانات في الملف." : "No data found in the file.",
    readErr:      isAr ? "خطأ في قراءة الملف" : "Failed to read file",
    importDone:   isAr ? "اكتمل الاستيراد" : "Import complete",
    addedN:       isAr ? "أُضيف" : "Added",
    updatedN:     isAr ? "حُدِّث" : "Updated",
    failedN:      isAr ? "فشل" : "Failed",
    sep:          isAr ? "، " : ", ",
    tplDl:        isAr ? "تم تحميل النموذج" : "Template downloaded",
    tplDlD:       isAr ? "يمكنك الآن ملء البيانات واستيرادها." : "You can now fill in the data and import it.",
    // Subscriptions import
    impSubs:      isAr ? "استيراد الاشتراكات السنوية" : "Import annual subscriptions",
    impSubsD:     isAr ? "رفع ملف Excel يحتوي على اشتراكات الأعضاء وربطها تلقائياً بسجلاتهم." : "Upload an Excel file with member payments to link them to their records.",
    matchTitle:   isAr ? "طريقة المطابقة مع الأعضاء:" : "Matching method:",
    matchById:    isAr ? "الأدق والأسرع (موصى به)" : "Most accurate and fastest (recommended)",
    matchByName:  isAr ? "بديل تلقائي" : "Automatic fallback",
    membershipNo: isAr ? "رقم العضوية" : "Membership number",
    nameCombo:    isAr ? "الاسم الأول + الكنية" : "First name + last name",
    requiredCols: isAr ? "الحقول المطلوبة في الملف:" : "Required fields in the file:",
    fNoOrName:    isAr ? "رقم العضوية أو الاسم" : "Membership number or name",
    fNoOrNameD:   isAr ? "للمطابقة" : "for matching",
    fYear:        isAr ? "سنة الاشتراك" : "Subscription year",
    fYearD:       isAr ? "مثل 2024" : "e.g. 2024",
    fAmount:      isAr ? "المبلغ" : "Amount",
    fAmountD:     isAr ? "رقم صحيح" : "integer",
    fDate:        isAr ? "تاريخ الدفع" : "Payment date",
    fDateD:       "YYYY-MM-DD",
    dlSubTpl:     isAr ? "تحميل نموذج الاشتراكات" : "Download subscriptions template",
    uploadSub:    isAr ? "رفع ملف الاشتراكات" : "Upload subscriptions file",
    updSubExist:  isAr ? "تحديث الاشتراكات الموجودة" : "Update existing subscriptions",
    updSubHelp:   isAr ? "عند تفعيله، يُحدِّث المبلغ والتاريخ والملاحظات لأي اشتراك موجود لنفس العضو ونفس السنة بدلاً من تجاهله." : "When enabled, updates amount, date and notes for any existing payment for the same member and year instead of skipping.",
    subResults:   isAr ? "نتائج استيراد الاشتراكات" : "Subscriptions import results",
    subTplDl:     isAr ? "تم تحميل نموذج الاشتراكات" : "Subscriptions template downloaded",
    subImpDone:   isAr ? "اكتمل استيراد الاشتراكات" : "Subscriptions import complete",
    // Backup
    backupTitle:  isAr ? "النسخ الاحتياطي" : "Backup",
    backupDesc:   isAr ? "تصدير نسخة احتياطية كاملة لجميع بيانات النظام (الأعضاء، الاشتراكات، المستخدمين)." : "Export a full backup of all system data (members, subscriptions, users).",
    backupIncl:   isAr ? "تشمل النسخة الاحتياطية:" : "The backup includes:",
    backupAllM:   isAr ? "بيانات جميع الأعضاء" : "All member data",
    backupAllS:   isAr ? "سجلّات الاشتراكات السنوية" : "Annual subscription records",
    backupUsers:  isAr ? "قائمة المستخدمين (بدون كلمات المرور)" : "User list (without passwords)",
    backupNote:   isAr ? "يُحفظ الملف بصيغة JSON ويمكن الاستفادة منه للأرشفة أو استعادة البيانات مستقبلاً." : "The file is saved as JSON and can be used for archiving or future restore.",
    exporting:    isAr ? "جارٍ التصدير..." : "Exporting...",
    exportBackup: isAr ? "تصدير نسخة احتياطية" : "Export backup",
    exportOk:     isAr ? "تم التصدير" : "Export complete",
    exportOkD:    isAr ? "تم تحميل النسخة الاحتياطية بنجاح." : "Backup downloaded successfully.",
    exportErr:    isAr ? "خطأ في التصدير" : "Export failed",
    // Access denied
    notAllowed:   isAr ? "غير مسموح بالدخول" : "Access denied",
    notAllowedD:  isAr ? "عذراً، صفحة الإعدادات متاحة للمدراء فقط." : "Sorry, the settings page is available to admins only.",
  };

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [memberUpdateExisting, setMemberUpdateExisting] = useState(false);
  const [subUpdateExisting, setSubUpdateExisting] = useState(false);
  const [subImportResult, setSubImportResult] = useState<ImportResult | null>(null);
  const [isSubImporting, setIsSubImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  const userFormSchema = buildUserSchema(isAr);

  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/user"] });

  // Number of admins; used to disable destructive actions on the last admin.
  const adminCount = (users ?? []).filter((u) => u.role === "admin").length;

  const onMutationError = (err: Error) => {
    toast({ title: L.error, description: err.message, variant: "destructive" });
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: L.success, description: L.addUserOk });
      setIsDialogOpen(false);
    },
    onError: onMutationError,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: L.success, description: L.updUserOk });
      setIsDialogOpen(false);
    },
    onError: onMutationError,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: L.success, description: L.delUserOk });
    },
    onError: onMutationError,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: "", password: "", role: "employee" },
  });

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      const updates = { ...data };
      if (!updates.password) delete updates.password;
      updateUserMutation.mutate({ id: editingUser.id, data: updates });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      password: "",
      role: user.role as "admin" | "employee",
    });
    setIsDialogOpen(true);
  };

  const startAdd = () => {
    setEditingUser(null);
    form.reset({ username: "", password: "", role: "employee" });
    setIsDialogOpen(true);
  };

  // ---- Excel template download ----
  const downloadTemplate = () => {
    const headers = IMPORT_COLUMNS.map((c) => (isAr ? c.labelAr : c.labelEn));
    const example = IMPORT_COLUMNS.map((c) => (isAr ? c.exampleAr : c.exampleEn));
    const notes = IMPORT_COLUMNS.map((c) => {
      if (c.key === "gender")
        return isAr ? "القيم: male أو female" : "Values: male or female";
      if (c.key === "membershipType")
        return isAr ? "القيم: original أو associate" : "Values: original or associate";
      if (c.key === "specialty")
        return isAr
          ? "القيم: cardiology أو cardiac_surgery"
          : "Values: cardiology or cardiac_surgery";
      if (c.key === "birthDate" || c.key === "joinDate")
        return isAr ? "الصيغة: YYYY-MM-DD" : "Format: YYYY-MM-DD";
      return "";
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, example, notes]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isAr ? "نموذج الاستيراد" : "Import template");
    XLSX.writeFile(
      wb,
      isAr ? "نموذج-استيراد-الاعضاء.xlsx" : "members-import-template.xlsx",
    );
    toast({ title: L.tplDl, description: L.tplDlD });
  };

  // ---- Excel file import ----
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rawRows.length < 2) {
        toast({ title: L.emptyFile, description: L.noData, variant: "destructive" });
        setIsImporting(false);
        return;
      }

      const headerRow = rawRows[0] as string[];
      const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== ""));

      // Accept either Arabic or English headers, regardless of current UI language.
      const colIndexMap = buildHeaderIndex(headerRow, IMPORT_COLUMNS);

      const members = dataRows.map((row) => {
        const obj: Record<string, string> = {};
        IMPORT_COLUMNS.forEach((col) => {
          const idx = colIndexMap[col.key];
          if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
            obj[col.key] = String(row[idx]).trim();
          }
        });
        return obj;
      });

      const res = await apiRequest("POST", "/api/members/import", {
        rows: members,
        updateExisting: memberUpdateExisting,
      });
      const result: ImportResult = await res.json();
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      if (result.success > 0 || (result.updated ?? 0) > 0) {
        const parts: string[] = [];
        if (result.success > 0) parts.push(`${L.addedN} ${result.success}`);
        if ((result.updated ?? 0) > 0) parts.push(`${L.updatedN} ${result.updated}`);
        if (result.failed > 0) parts.push(`${L.failedN} ${result.failed}`);
        toast({
          title: L.importDone,
          description: parts.join(L.sep),
        });
      }
    } catch {
      toast({ title: L.readErr, variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---- Subscriptions template download ----
  const downloadSubTemplate = () => {
    const headers = SUB_IMPORT_COLUMNS.map((c) => (isAr ? c.labelAr : c.labelEn));
    const example = SUB_IMPORT_COLUMNS.map((c) => (isAr ? c.exampleAr : c.exampleEn));
    const notes = SUB_IMPORT_COLUMNS.map((c) => {
      if (c.key === "year")
        return isAr ? "رقم السنة الميلادية مثل 2024" : "Gregorian year, e.g. 2024";
      if (c.key === "amount")
        return isAr ? "رقم صحيح بالليرة السورية" : "Integer in Syrian Pounds";
      if (c.key === "date")
        return isAr ? "الصيغة: YYYY-MM-DD" : "Format: YYYY-MM-DD";
      if (c.key === "membershipNumber")
        return isAr ? "مُفضَّل للمطابقة الدقيقة" : "Preferred for exact matching";
      if (c.key === "firstName" || c.key === "lastName")
        return isAr
          ? "بديل عند غياب رقم العضوية"
          : "Used as fallback if membership number is missing";
      return "";
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, example, notes]);
    ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      isAr ? "نموذج الاشتراكات" : "Subscriptions template",
    );
    XLSX.writeFile(
      wb,
      isAr ? "نموذج-استيراد-الاشتراكات.xlsx" : "subscriptions-import-template.xlsx",
    );
    toast({ title: L.subTplDl });
  };

  // ---- Subscriptions file import ----
  const handleSubFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubImportResult(null);
    setIsSubImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rawRows.length < 2) {
        toast({ title: L.emptyFile, variant: "destructive" });
        setIsSubImporting(false);
        return;
      }

      const headerRow = rawRows[0] as string[];
      const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== ""));

      // Accept either Arabic or English headers, regardless of current UI language.
      const colIndexMap = buildHeaderIndex(headerRow, SUB_IMPORT_COLUMNS);

      const rows = dataRows.map((row) => {
        const obj: Record<string, any> = {};
        SUB_IMPORT_COLUMNS.forEach((col) => {
          const idx = colIndexMap[col.key];
          if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
            obj[col.key] = col.key === "year" || col.key === "amount"
              ? Number(row[idx])
              : String(row[idx]).trim();
          }
        });
        return obj;
      });

      const res = await apiRequest("POST", "/api/subscriptions/import", {
        rows,
        updateExisting: subUpdateExisting,
      });
      const result: ImportResult = await res.json();
      setSubImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      if (result.success > 0 || (result.updated ?? 0) > 0) {
        const parts: string[] = [];
        if (result.success > 0) parts.push(`${L.addedN} ${result.success}`);
        if ((result.updated ?? 0) > 0) parts.push(`${L.updatedN} ${result.updated}`);
        if (result.failed > 0) parts.push(`${L.failedN} ${result.failed}`);
        toast({
          title: L.subImpDone,
          description: parts.join(L.sep),
        });
      }
    } catch {
      toast({ title: L.readErr, variant: "destructive" });
    } finally {
      setIsSubImporting(false);
      if (subFileInputRef.current) subFileInputRef.current.value = "";
    }
  };

  // ---- Backup download ----
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await apiRequest("GET", "/api/backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scva-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: L.exportOk, description: L.exportOkD });
    } catch {
      toast({ title: L.exportErr, variant: "destructive" });
    } finally {
      setIsBackingUp(false);
    }
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />;

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">{L.notAllowed}</h2>
        <p className="text-muted-foreground max-w-sm">{L.notAllowedD}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{L.title}</h1>
        <p className="text-muted-foreground mt-1">{L.subtitle}</p>
      </div>

      {/* ===== User Management ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">{L.usersTitle}</CardTitle>
            <CardDescription>{L.usersDesc}</CardDescription>
          </div>
          <Button onClick={startAdd} size="sm">
            <UserPlus className="ms-2 h-4 w-4" />
            {L.addUser}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg overflow-hidden border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className={`${isAr ? "text-right" : "text-left"} font-semibold`}>{L.username}</TableHead>
                  <TableHead className={`${isAr ? "text-right" : "text-left"} font-semibold`}>{L.role}</TableHead>
                  <TableHead className={`${isAr ? "text-left" : "text-right"} font-semibold w-24`}>{L.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const isLastAdmin =
                    user.role === "admin" && adminCount <= 1;
                  const cannotDelete = isSelf || isLastAdmin;
                  const deleteTitle = isSelf
                    ? L.cantDelSelf
                    : isLastAdmin
                    ? L.cantDelLast
                    : L.delUser;
                  return (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? L.admin : L.employee}
                        </Badge>
                      </TableCell>
                      <TableCell className={isAr ? "text-left" : "text-right"}>
                        <div className={`flex gap-1 ${isAr ? "justify-end" : "justify-start"}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(user)}
                            className="h-8 w-8"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={cannotDelete}
                            title={deleteTitle}
                            aria-label={deleteTitle}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-auto"
                            onClick={() => {
                              if (cannotDelete) return;
                              if (confirm(L.confirmDel)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Data Import ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">{L.impMembers}</CardTitle>
              <CardDescription>{L.impMembersD}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">{L.steps}</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>{L.step1}</li>
              <li>{L.step2}</li>
              <li>{L.step3}</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              {L.dlTemplate}
            </Button>

            <div className="relative">
              <Button
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isImporting ? L.importing : L.uploadFile}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 cursor-pointer">
            <Checkbox
              id="member-update-existing"
              checked={memberUpdateExisting}
              onCheckedChange={(c) => setMemberUpdateExisting(c === true)}
              data-testid="checkbox-member-update-existing"
              className="mt-0.5"
            />
            <div className="space-y-0.5 text-sm">
              <span className="font-medium">{L.updExisting}</span>
              <p className="text-xs text-muted-foreground">{L.updExHelp}</p>
            </div>
          </label>

          {importResult && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{L.importRes}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportResult(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{L.succeeded} <strong>{importResult.success}</strong></span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{L.failed} <strong>{importResult.failed}</strong></span>
                  </div>
                )}
                {importResult.updated !== undefined && importResult.updated > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{L.updated} <strong>{importResult.updated}</strong></span>
                  </div>
                )}
                {importResult.skipped !== undefined && importResult.skipped > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{L.skipped} <strong>{importResult.skipped}</strong></span>
                  </div>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive font-mono">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Subscriptions Import ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">{L.impSubs}</CardTitle>
              <CardDescription>{L.impSubsD}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">{L.matchTitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">①</span>
                <span><strong>{L.membershipNo}</strong> — {L.matchById}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">②</span>
                <span><strong>{L.nameCombo}</strong> — {L.matchByName}</span>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-1.5">{L.requiredCols}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: L.fNoOrName, note: L.fNoOrNameD },
                  { label: L.fYear,     note: L.fYearD },
                  { label: L.fAmount,   note: L.fAmountD },
                  { label: L.fDate,     note: L.fDateD },
                ].map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                    <strong>{f.label}</strong>
                    <span className="text-muted-foreground">({f.note})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadSubTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              {L.dlSubTpl}
            </Button>
            <div className="relative">
              <Button
                variant="default"
                onClick={() => subFileInputRef.current?.click()}
                disabled={isSubImporting}
                className="gap-2"
              >
                {isSubImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isSubImporting ? L.importing : L.uploadSub}
              </Button>
              <input
                ref={subFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleSubFileImport}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 cursor-pointer">
            <Checkbox
              id="sub-update-existing"
              checked={subUpdateExisting}
              onCheckedChange={(c) => setSubUpdateExisting(c === true)}
              data-testid="checkbox-sub-update-existing"
              className="mt-0.5"
            />
            <div className="space-y-0.5 text-sm">
              <span className="font-medium">{L.updSubExist}</span>
              <p className="text-xs text-muted-foreground">{L.updSubHelp}</p>
            </div>
          </label>

          {subImportResult && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{L.subResults}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSubImportResult(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{L.succeeded} <strong>{subImportResult.success}</strong></span>
                </div>
                {subImportResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{L.failed} <strong>{subImportResult.failed}</strong></span>
                  </div>
                )}
                {subImportResult.updated !== undefined && subImportResult.updated > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{L.updated} <strong>{subImportResult.updated}</strong></span>
                  </div>
                )}
                {subImportResult.skipped !== undefined && subImportResult.skipped > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{L.skipped} <strong>{subImportResult.skipped}</strong></span>
                  </div>
                )}
              </div>
              {subImportResult.errors.length > 0 && (
                <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 space-y-1 max-h-40 overflow-y-auto">
                  {subImportResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive font-mono">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Backup & Restore ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <DatabaseBackup className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">{L.backupTitle}</CardTitle>
              <CardDescription>{L.backupDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1.5">
            <p>{L.backupIncl}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{L.backupAllM}</li>
              <li>{L.backupAllS}</li>
              <li>{L.backupUsers}</li>
            </ul>
            <p className="pt-1 text-xs">{L.backupNote}</p>
          </div>
          <Button onClick={handleBackup} disabled={isBackingUp} variant="outline" className="gap-2">
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isBackingUp ? L.exporting : L.exportBackup}
          </Button>
        </CardContent>
      </Card>

      {/* ===== User Dialog ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? L.editUser : L.addUserNew}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{L.username}</Label>
              <Input {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? L.pwdEdit : L.pwd}</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{L.role}</Label>
              <Select
                defaultValue={form.getValues("role")}
                onValueChange={(val: any) => form.setValue("role", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={L.pickRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{L.admin}</SelectItem>
                  <SelectItem value="employee">{L.employee}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) && (
                <Loader2 className="ms-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? L.save : L.add}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
