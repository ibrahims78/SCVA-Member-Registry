import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useMembers } from "@/context/MembersContext";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  FileDown,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Plus,
  Building2,
  Stethoscope,
  Hash,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import NotFound from "./not-found";
import { cn } from "@/lib/utils";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  AlignmentType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import logoBase64 from "../assets/logo.base64.txt?raw";

function InfoItem({
  icon: Icon,
  label,
  value,
  isLtr = false,
  testId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  isLtr?: boolean;
  testId?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-colors">
      <span className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 ring-1 ring-primary/15">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-medium text-foreground mt-0.5 break-words leading-snug",
            isLtr && "font-mono",
          )}
          dir={isLtr ? "ltr" : undefined}
          data-testid={testId}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function MemberDetails() {
  const [, params] = useRoute("/member/:id");
  const { t, language, direction } = useLanguage();
  const {
    getMember,
    deleteMember,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  } = useMembers();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const member = getMember(params?.id || "");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    year: new Date().getFullYear(),
    amount: "",
    notes: "",
  });

  // Edit subscription state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState({
    year: new Date().getFullYear(),
    amount: "",
    notes: "",
    date: "",
  });
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const isAr = language === "ar";
  const BackArrow = direction === "rtl" ? ArrowRight : ArrowLeft;
  const currentYear = new Date().getFullYear();

  const totals = useMemo(() => {
    if (!member) return { count: 0, amount: 0, currentYearPaid: false };
    return {
      count: member.subscriptions.length,
      amount: member.subscriptions.reduce((s, sub) => s + sub.amount, 0),
      currentYearPaid: member.subscriptions.some((s) => s.year === currentYear),
    };
  }, [member, currentYear]);

  if (!member) return <NotFound />;

  const handleDelete = () => {
    deleteMember(member.id);
    toast({ title: isAr ? "تمّ حذف العضو" : "Member deleted" });
    setLocation("/members");
  };

  const handleAddPayment = () => {
    const amount = Number(newPayment.amount);
    if (!amount || amount <= 0) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "أدخل مبلغاً صحيحاً" : "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    addSubscription(member.id, {
      year: Number(newPayment.year),
      amount,
      notes: newPayment.notes,
      date: new Date().toISOString().split("T")[0],
    });
    setIsPaymentOpen(false);
    setNewPayment({ year: currentYear, amount: "", notes: "" });
    toast({ title: isAr ? "تمّ تسجيل الاشتراك" : "Payment recorded" });
  };

  const openEditPayment = (sub: {
    id: string;
    year: number;
    amount: number;
    notes: string | null;
    date: string;
  }) => {
    setEditingSubId(sub.id);
    setEditPayment({
      year: sub.year,
      amount: String(sub.amount),
      notes: sub.notes ?? "",
      date: sub.date ? sub.date.slice(0, 10) : "",
    });
  };

  const handleSaveEditPayment = () => {
    if (!editingSubId) return;
    const amount = Number(editPayment.amount);
    if (!amount || amount < 0) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "أدخل مبلغاً صحيحاً" : "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    if (!editPayment.date) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "التاريخ مطلوب" : "Date is required",
        variant: "destructive",
      });
      return;
    }
    updateSubscription(editingSubId, {
      year: Number(editPayment.year),
      amount,
      notes: editPayment.notes,
      date: editPayment.date,
    });
    setEditingSubId(null);
  };

  const handleConfirmDeleteSub = () => {
    if (!deletingSubId) return;
    deleteSubscription(deletingSubId);
    setDeletingSubId(null);
  };

  const generateWord = async () => {
    const logoData = logoBase64.trim();
    const binaryString = window.atob(logoData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes,
                transformation: { width: 80, height: 80 },
                type: "jpg",
              } as any),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: isAr ? "الرابطة السورية لأمراض وجراحة القلب" : "Syrian Cardiovascular Association", bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: isAr ? "تقرير معلومات عضو" : "Member Information Report", bold: true, size: 32 })],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: isAr ? "المعلومات الشخصية" : "Personal Information", bold: true, size: 24 })] }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ["الاسم الكامل", "Full Name", member.fullName],
              ["الاسم بالانجليزية", "English Name", member.englishName],
              ["اسم الأب", "Father Name", member.fatherName],
              ["تاريخ الميلاد", "Birth Date", member.birthDate],
              ["الجنس", "Gender", t(`val.${member.gender}`)],
              ["التخصص", "Specialty", t(`val.${member.specialty}`)],
              ["عنوان العمل", "Work Address", member.workAddress],
              ["تاريخ الانضمام", "Join Date", member.joinDate],
              ["رقم الهاتف", "Phone", member.phone],
              ["البريد الإلكتروني", "Email", member.email],
            ].map(([ar, en, val]) => new DocxTableRow({
              children: [
                new DocxTableCell({ children: [new Paragraph(isAr ? (ar ?? "") : (en ?? ""))] }),
                new DocxTableCell({ children: [new Paragraph(val ?? "—")] }),
              ],
            })),
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ children: [new TextRun({ text: isAr ? "سجل الاشتراكات" : "Subscription History", bold: true, size: 24 })] }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(isAr ? "السنة" : "Year")] }),
                  new DocxTableCell({ children: [new Paragraph(isAr ? "المبلغ" : "Amount")] }),
                  new DocxTableCell({ children: [new Paragraph(isAr ? "ملاحظات" : "Notes")] }),
                ],
              }),
              ...member.subscriptions.map((sub) => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(sub.year.toString())] }),
                  new DocxTableCell({ children: [new Paragraph(sub.amount.toLocaleString())] }),
                  new DocxTableCell({ children: [new Paragraph(sub.notes || "-")] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `Member_${member.fullName}.docx`);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
      {/* ===== Action bar ===== */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden"
        data-testid="member-actions"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/members")}
          className="gap-2 self-start"
          data-testid="button-back"
        >
          <BackArrow className="h-4 w-4" />
          {isAr ? "كلّ الأعضاء" : "All members"}
        </Button>

        <div className="flex flex-wrap gap-2">
          <Link href={`/edit-member/${member.id}`}>
            <Button variant="outline" size="sm" data-testid="button-edit">
              <Edit className="me-2 h-4 w-4" />
              {t("action.edit")}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/members/${member.id}/pdf`, "_blank")}
            data-testid="button-pdf"
          >
            <FileDown className="me-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateWord}
            data-testid="button-word"
          >
            <FileText className="me-2 h-4 w-4" />
            Word
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                data-testid="button-delete"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t("action.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isAr ? "تأكيد حذف العضو" : "Confirm member deletion"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isAr
                    ? `سيتم حذف "${member.fullName}" وكلّ بيانات اشتراكاته نهائياً. لا يمكن التراجع عن هذا الإجراء.`
                    : `"${member.fullName}" and all their subscription records will be permanently deleted. This action cannot be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">
                  {t("action.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {isAr ? "حذف نهائي" : "Delete permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ===== Hero ===== */}
      <Card className="overflow-hidden print:shadow-none print:border-2">
        <div className="bg-brand-gradient text-primary-foreground px-6 py-8 print:bg-none print:text-black print:py-4 relative">
          <div className="absolute inset-0 bg-grid-soft opacity-10 print:hidden" />
          <div className="relative z-10 flex flex-col items-center text-center gap-3">
            <Badge
              variant="secondary"
              className="bg-primary-foreground/15 text-primary-foreground border-0 px-3 py-0.5 backdrop-blur-sm print:bg-white print:text-black print:border-2 print:border-black"
            >
              {t(`val.${member.membershipType}`)}
            </Badge>
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight print:text-2xl"
              data-testid="text-member-name"
            >
              {member.fullName}
            </h1>
            <p className="text-base text-primary-foreground/85 font-medium print:text-gray-700" dir="ltr">
              {member.englishName}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs">
              {member.membershipNumber && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm print:bg-white print:text-black">
                  <Hash className="h-3 w-3" />
                  {isAr ? "رقم العضوية" : "Membership #"} {member.membershipNumber}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm print:bg-white print:text-black">
                <Calendar className="h-3 w-3" />
                {member.joinDate}
              </span>
              {member.city && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm print:bg-white print:text-black">
                  <Building2 className="h-3 w-3" />
                  {member.city}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ===== Subscription summary cards ===== */}
      <section className="grid gap-3 sm:grid-cols-3 print:hidden">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                {isAr ? "إجمالي المدفوعات" : "Total paid"}
              </p>
              <p className="text-lg font-bold tabular-nums" data-testid="stat-total-paid">
                {totals.amount.toLocaleString(isAr ? "ar-SY" : "en-US")}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  {isAr ? "ل.س" : "SYP"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center ring-1 ring-info/15">
              <Hash className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                {isAr ? "عدد الاشتراكات" : "Payment count"}
              </p>
              <p className="text-lg font-bold tabular-nums" data-testid="stat-sub-count">
                {totals.count}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center ring-1",
                totals.currentYearPaid
                  ? "bg-success/10 text-success ring-success/15"
                  : "bg-warning/10 text-warning ring-warning/15",
              )}
            >
              {totals.currentYearPaid ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                {isAr ? `حالة عام ${currentYear}` : `${currentYear} status`}
              </p>
              <p
                className={cn(
                  "text-sm font-bold",
                  totals.currentYearPaid ? "text-success" : "text-warning",
                )}
                data-testid="stat-current-year"
              >
                {totals.currentYearPaid
                  ? isAr ? "مدفوع" : "Paid"
                  : isAr ? "غير مدفوع" : "Unpaid"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== Detailed info ===== */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" aria-hidden="true" />
            {isAr ? "المعلومات التفصيلية" : "Detailed information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoItem
              icon={UserIcon}
              label={t("field.fatherName")}
              value={member.fatherName}
              testId="info-fatherName"
            />
            <InfoItem
              icon={Calendar}
              label={t("field.birthDate")}
              value={member.birthDate}
              testId="info-birthDate"
            />
            <InfoItem
              icon={UserIcon}
              label={t("field.gender")}
              value={t(`val.${member.gender}`)}
              testId="info-gender"
            />
            <InfoItem
              icon={Stethoscope}
              label={t("field.specialty")}
              value={t(`val.${member.specialty}`)}
              testId="info-specialty"
            />
            <InfoItem
              icon={Building2}
              label={t("field.workAddress")}
              value={member.workAddress}
              testId="info-workAddress"
            />
            <InfoItem
              icon={Phone}
              label={t("field.phone")}
              value={member.phone}
              isLtr
              testId="info-phone"
            />
            <InfoItem
              icon={Mail}
              label={t("field.email")}
              value={member.email}
              isLtr
              testId="info-email"
            />
            {member.escId && (
              <InfoItem
                icon={Hash}
                label={t("field.escId")}
                value={member.escId}
                isLtr
                testId="info-escId"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== Subscriptions ===== */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" aria-hidden="true" />
            {t("sub.history")}
          </CardTitle>
          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="print:hidden" data-testid="button-add-payment">
                <Plus className="me-2 h-4 w-4" />
                {t("sub.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("sub.add")}</DialogTitle>
                <DialogDescription>
                  {isAr
                    ? `تسجيل دفعة اشتراك جديدة لـ ${member.fullName}`
                    : `Record a new subscription payment for ${member.fullName}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payment-year">{t("sub.year")}</Label>
                    <Input
                      id="payment-year"
                      type="number"
                      value={newPayment.year}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, year: parseInt(e.target.value) || currentYear })
                      }
                      data-testid="input-payment-year"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="payment-amount">
                      {t("sub.value")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      placeholder="0"
                      data-testid="input-payment-amount"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-notes">
                    {t("sub.notes")}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({isAr ? "اختياري" : "optional"})
                    </span>
                  </Label>
                  <Textarea
                    id="payment-notes"
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    rows={2}
                    data-testid="input-payment-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  data-testid="button-cancel-payment"
                >
                  {t("action.cancel")}
                </Button>
                <Button onClick={handleAddPayment} data-testid="button-save-payment">
                  {t("action.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-28 text-start font-semibold">{t("sub.year")}</TableHead>
                  <TableHead className="text-start font-semibold">{t("sub.value")}</TableHead>
                  <TableHead className="text-start font-semibold">{t("sub.notes")}</TableHead>
                  <TableHead className="text-start font-semibold">
                    {isAr ? "التاريخ" : "Date"}
                  </TableHead>
                  <TableHead
                    className="w-24 text-end font-semibold print:hidden"
                    aria-label={isAr ? "إجراءات" : "Actions"}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32">
                      <div className="flex flex-col items-center justify-center text-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isAr ? "لا يوجد سجلّ اشتراكات بعد" : "No payments recorded yet"}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsPaymentOpen(true)}
                          className="mt-1 print:hidden"
                        >
                          <Plus className="me-2 h-3.5 w-3.5" />
                          {t("sub.add")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  [...member.subscriptions]
                    .sort((a, b) => b.year - a.year)
                    .map((sub) => (
                      <TableRow
                        key={sub.id}
                        className="hover:bg-muted/30"
                        data-testid={`row-subscription-${sub.id}`}
                      >
                        <TableCell>
                          <Badge
                            variant={sub.year === currentYear ? "default" : "secondary"}
                            className="font-bold tabular-nums"
                          >
                            {sub.year}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums text-foreground">
                          {sub.amount.toLocaleString(isAr ? "ar-SY" : "en-US")}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            {isAr ? "ل.س" : "SYP"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.notes || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {sub.date
                            ? new Date(sub.date).toLocaleDateString(
                                isAr ? "ar-SY" : "en-US",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="text-end print:hidden">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditPayment(sub)}
                              aria-label={isAr ? "تعديل الاشتراك" : "Edit subscription"}
                              data-testid={`button-edit-subscription-${sub.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingSubId(sub.id)}
                              aria-label={isAr ? "حذف الاشتراك" : "Delete subscription"}
                              data-testid={`button-delete-subscription-${sub.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== Edit subscription dialog ===== */}
      <Dialog
        open={editingSubId !== null}
        onOpenChange={(open) => !open && setEditingSubId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isAr ? "تعديل الاشتراك" : "Edit subscription"}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? "حدّث معلومات قيد الاشتراك ثم احفظ التغييرات."
                : "Update the subscription record and save your changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-payment-year">{t("sub.year")}</Label>
                <Input
                  id="edit-payment-year"
                  type="number"
                  value={editPayment.year}
                  onChange={(e) =>
                    setEditPayment({
                      ...editPayment,
                      year: parseInt(e.target.value) || currentYear,
                    })
                  }
                  data-testid="input-edit-payment-year"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-payment-amount">
                  {t("sub.value")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-payment-amount"
                  type="number"
                  value={editPayment.amount}
                  onChange={(e) =>
                    setEditPayment({ ...editPayment, amount: e.target.value })
                  }
                  placeholder="0"
                  data-testid="input-edit-payment-amount"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-date">
                {isAr ? "التاريخ" : "Date"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-payment-date"
                type="date"
                value={editPayment.date}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, date: e.target.value })
                }
                data-testid="input-edit-payment-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-notes">
                {t("sub.notes")}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({isAr ? "اختياري" : "optional"})
                </span>
              </Label>
              <Textarea
                id="edit-payment-notes"
                value={editPayment.notes}
                onChange={(e) =>
                  setEditPayment({ ...editPayment, notes: e.target.value })
                }
                rows={2}
                data-testid="input-edit-payment-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSubId(null)}
              data-testid="button-cancel-edit-payment"
            >
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleSaveEditPayment}
              data-testid="button-save-edit-payment"
            >
              {t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete subscription confirmation ===== */}
      <AlertDialog
        open={deletingSubId !== null}
        onOpenChange={(open) => !open && setDeletingSubId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "حذف الاشتراك" : "Delete subscription"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? "هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this record? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-subscription">
              {t("action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteSub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-subscription"
            >
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
