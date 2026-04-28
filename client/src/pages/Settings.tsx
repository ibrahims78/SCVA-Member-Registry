import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, UserPlus, Pencil, Trash2, ShieldCheck,
  FileSpreadsheet, Download, Upload, DatabaseBackup,
  CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { useState, useRef } from "react";
import { z } from "zod";
import * as XLSX from "xlsx";

const userFormSchema = insertUserSchema.extend({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional().or(z.literal("")),
  role: z.enum(["admin", "employee"]),
});
type UserFormValues = z.infer<typeof userFormSchema>;

const IMPORT_COLUMNS = [
  { key: "firstName",     label: "الاسم الأول *",          example: "محمد" },
  { key: "lastName",      label: "الكنية *",               example: "الأحمد" },
  { key: "fullName",      label: "الاسم الكامل",           example: "محمد علي الأحمد" },
  { key: "fatherName",    label: "اسم الأب",               example: "علي" },
  { key: "englishName",   label: "الاسم بالإنجليزية",      example: "Mohammad Al-Ahmad" },
  { key: "birthDate",     label: "تاريخ الميلاد",          example: "1985-06-15" },
  { key: "gender",        label: "الجنس",                  example: "male" },
  { key: "specialty",     label: "التخصص",                 example: "cardiology" },
  { key: "email",         label: "البريد الإلكتروني",      example: "example@email.com" },
  { key: "phone",         label: "رقم الهاتف",             example: "0911234567" },
  { key: "city",          label: "المدينة",                example: "دمشق" },
  { key: "workAddress",   label: "عنوان العمل",            example: "مستشفى المجتهد" },
  { key: "joinDate",      label: "تاريخ الانضمام",         example: "2020-01-01" },
  { key: "membershipType",label: "نوع العضوية",            example: "original" },
  { key: "escId",         label: "معرّف الجمعية الأوروبية",example: "" },
];

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/user"] });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم النجاح", description: "تم إضافة المستخدم بنجاح" });
      setIsDialogOpen(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormValues> }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم النجاح", description: "تم تحديث بيانات المستخدم" });
      setIsDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم النجاح", description: "تم حذف المستخدم" });
    },
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

  const startEdit = (user: any) => {
    setEditingUser(user);
    form.reset({ username: user.username, password: "", role: user.role });
    setIsDialogOpen(true);
  };

  const startAdd = () => {
    setEditingUser(null);
    form.reset({ username: "", password: "", role: "employee" });
    setIsDialogOpen(true);
  };

  // ---- Excel template download ----
  const downloadTemplate = () => {
    const headers = IMPORT_COLUMNS.map((c) => c.label);
    const example = IMPORT_COLUMNS.map((c) => c.example);
    const notes = IMPORT_COLUMNS.map((c) =>
      c.key === "gender"
        ? "القيم: male أو female"
        : c.key === "membershipType"
        ? "القيم: original أو associate"
        : c.key === "specialty"
        ? "القيم: cardiology أو cardiac_surgery"
        : c.key === "birthDate" || c.key === "joinDate"
        ? "الصيغة: YYYY-MM-DD"
        : ""
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, example, notes]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نموذج الاستيراد");
    XLSX.writeFile(wb, "نموذج-استيراد-الاعضاء.xlsx");
    toast({ title: "تم تحميل النموذج", description: "يمكنك الآن ملء البيانات واستيرادها." });
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
        toast({ title: "الملف فارغ", description: "لا توجد بيانات في الملف.", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      const headerRow = rawRows[0] as string[];
      const dataRows = rawRows.slice(1).filter((r) => r.some((c) => c !== undefined && c !== ""));

      const colIndexMap: Record<string, number> = {};
      IMPORT_COLUMNS.forEach((col) => {
        const idx = headerRow.findIndex((h) => h === col.label);
        if (idx !== -1) colIndexMap[col.key] = idx;
      });

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

      const res = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members),
      });
      const result: ImportResult = await res.json();
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      if (result.success > 0) {
        toast({
          title: "اكتمل الاستيراد",
          description: `تمّ استيراد ${result.success} عضو بنجاح${result.failed > 0 ? `، فشل ${result.failed}` : ""}.`,
        });
      }
    } catch {
      toast({ title: "خطأ في قراءة الملف", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---- Backup download ----
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("فشل في تحميل النسخة الاحتياطية");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scva-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم التصدير", description: "تم تحميل النسخة الاحتياطية بنجاح." });
    } catch {
      toast({ title: "خطأ في التصدير", variant: "destructive" });
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
        <h2 className="text-2xl font-bold">غير مسموح بالدخول</h2>
        <p className="text-muted-foreground max-w-sm">عذراً، صفحة الإعدادات متاحة للمدراء فقط.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
        <p className="text-muted-foreground mt-1">إدارة المستخدمين، استيراد البيانات، والنسخ الاحتياطي.</p>
      </div>

      {/* ===== User Management ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">إدارة المستخدمين</CardTitle>
            <CardDescription>إضافة وتعديل وحذف حسابات النظام.</CardDescription>
          </div>
          <Button onClick={startAdd} size="sm">
            <UserPlus className="ms-2 h-4 w-4" />
            إضافة مستخدم
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg overflow-hidden border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-semibold">اسم المستخدم</TableHead>
                  <TableHead className="text-right font-semibold">الدور</TableHead>
                  <TableHead className="text-left font-semibold w-24">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "مدير" : "موظف"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(user)} className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {user.username !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              <CardTitle className="text-lg">استيراد بيانات الأعضاء</CardTitle>
              <CardDescription>رفع ملف Excel يحتوي على بيانات الأعضاء لإضافتهم دفعةً واحدة.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">الخطوات:</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>حمّل نموذج Excel الرسمي بالضغط على الزر أدناه.</li>
              <li>أدخل بيانات الأعضاء في الملف (الاسم الأول والكنية إلزاميان، باقي الحقول اختيارية).</li>
              <li>ارفع الملف المعبّأ لبدء الاستيراد التلقائي.</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              تحميل نموذج Excel
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
                {isImporting ? "جارٍ الاستيراد..." : "رفع ملف الاستيراد"}
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

          {importResult && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">نتائج الاستيراد</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportResult(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تمّ بنجاح: <strong>{importResult.success}</strong></span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>فشل: <strong>{importResult.failed}</strong></span>
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

      {/* ===== Backup & Restore ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
              <DatabaseBackup className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">النسخ الاحتياطي</CardTitle>
              <CardDescription>تصدير نسخة احتياطية كاملة لجميع بيانات النظام (الأعضاء، الاشتراكات، المستخدمين).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1.5">
            <p>تشمل النسخة الاحتياطية:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>بيانات جميع الأعضاء</li>
              <li>سجلّات الاشتراكات السنوية</li>
              <li>قائمة المستخدمين (بدون كلمات المرور)</li>
            </ul>
            <p className="pt-1 text-xs">يُحفظ الملف بصيغة JSON ويمكن الاستفادة منه للأرشفة أو استعادة البيانات مستقبلاً.</p>
          </div>
          <Button onClick={handleBackup} disabled={isBackingUp} variant="outline" className="gap-2">
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isBackingUp ? "جارٍ التصدير..." : "تصدير نسخة احتياطية"}
          </Button>
        </CardContent>
      </Card>

      {/* ===== User Dialog ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>اسم المستخدم</Label>
              <Input {...form.register("username")} />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "كلمة مرور جديدة (اتركها فارغة لعدم التغيير)" : "كلمة المرور"}</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select
                defaultValue={form.getValues("role")}
                onValueChange={(val: any) => form.setValue("role", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="employee">موظف</SelectItem>
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
              {editingUser ? "تحديث" : "إضافة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
