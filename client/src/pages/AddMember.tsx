import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/context/LanguageContext";
import { useMembers } from "@/context/MembersContext";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { GENDERS, MEMBERSHIP_TYPES, SPECIALTIES } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  UserCircle2,
  Hash,
  Briefcase,
  AtSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const memberSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الكنية مطلوبة"),
  fullName: z.string().optional(),
  fatherName: z.string().optional(),
  englishName: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  specialty: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  phone: z.string().optional(),
  workAddress: z.string().optional(),
  city: z.string().optional(),
  joinDate: z.string().optional(),
  membershipType: z.enum(["original", "associate"]).optional(),
  escId: z.string().optional(),
  membershipNumber: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3 pb-3 border-b">
        <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </header>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export default function AddMember() {
  const { t, language, direction } = useLanguage();
  const { getMember } = useMembers();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/edit-member/:id");
  const isEdit = !!(match && params?.id);
  const { toast } = useToast();
  const isAr = language === "ar";
  const BackArrow = direction === "rtl" ? ArrowRight : ArrowLeft;

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      fullName: "",
      fatherName: "",
      englishName: "",
      birthDate: "",
      gender: "male",
      specialty: "cardiology",
      email: "",
      phone: "",
      workAddress: "",
      city: "",
      joinDate: new Date().toISOString().split("T")[0],
      membershipType: "original",
      escId: "",
      membershipNumber: "",
    },
  });

  useEffect(() => {
    if (isEdit && params?.id) {
      const member = getMember(params.id);
      if (member) {
        form.reset({
          firstName: member.firstName || "",
          lastName: member.lastName || "",
          fullName: member.fullName || "",
          fatherName: member.fatherName || "",
          englishName: member.englishName || "",
          birthDate: member.birthDate || "",
          gender: (member.gender as "male" | "female") || "male",
          specialty: member.specialty || "cardiology",
          email: member.email || "",
          phone: member.phone || "",
          workAddress: member.workAddress || "",
          city: member.city || "",
          joinDate: member.joinDate || "",
          membershipType: (member.membershipType as "original" | "associate") || "original",
          escId: member.escId || "",
          membershipNumber: member.membershipNumber?.toString() || "",
        });
      } else {
        toast({
          title: isAr ? "العضو غير موجود" : "Member not found",
          variant: "destructive",
        });
        setLocation("/members");
      }
    }
  }, [isEdit, params?.id, getMember, form, setLocation, toast, isAr]);

  const addMemberMutation = useMutation({
    mutationFn: async (newMember: Omit<MemberFormValues, "membershipNumber">) => {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: t("app.success") || (isAr ? "تم الحفظ بنجاح" : "Saved successfully") });
      setLocation("/members");
    },
    onError: (error: Error) => {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (updates: Omit<MemberFormValues, "membershipNumber">) => {
      const res = await fetch(`/api/members/${params?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: isAr ? "تمّ التحديث بنجاح" : "Updated successfully" });
      setLocation(`/member/${params?.id}`);
    },
  });

  const isPending = addMemberMutation.isPending || updateMemberMutation.isPending;

  function onSubmit(values: MemberFormValues) {
    const { membershipNumber: _, ...rest } = values;
    if (isEdit && params?.id) updateMemberMutation.mutate(rest);
    else addMemberMutation.mutate(rest);
  }

  const cancelHref = isEdit ? `/member/${params?.id}` : "/members";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(cancelHref)}
          aria-label={isAr ? "رجوع" : "Back"}
          data-testid="button-back"
        >
          <BackArrow className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
            {isEdit
              ? isAr ? "تعديل بيانات العضو" : "Edit member"
              : isAr ? "إضافة عضو جديد" : "Add a new member"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? "الحقول المعلَّمة بـ * إجباريّة فقط. بقية الحقول اختيارية يمكن إكمالها لاحقاً."
              : "Only fields marked with * are required. Other fields are optional and can be filled later."}
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>

              {/* ===== Personal Info ===== */}
              <FormSection
                icon={UserCircle2}
                title={isAr ? "البيانات الشخصيّة" : "Personal information"}
                description={isAr ? "الاسم والتاريخ والجنس" : "Name, date of birth and gender"}
              >
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.firstName")} <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} data-testid="input-firstName" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.lastName")} <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} data-testid="input-lastName" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.fullName")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-fullName" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="englishName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.englishName")}</FormLabel>
                    <FormControl><Input {...field} className="text-left" dir="ltr" data-testid="input-englishName" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fatherName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.fatherName")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-fatherName" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="birthDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.birthDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-birthDate" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.gender")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder={t("field.gender")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {isAr ? g.labelAr : g.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              {/* ===== Membership ===== */}
              <FormSection
                icon={Hash}
                title={isAr ? "بيانات العضوية" : "Membership"}
                description={isAr ? "الأرقام والمعرّفات الخاصّة بالجمعيّة" : "Identifiers and registry numbers"}
              >
                <FormField control={form.control} name="membershipNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.membershipNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        placeholder={isEdit ? field.value : t("app.auto_generated") || "تلقائي"}
                        data-testid="input-membershipNumber"
                      />
                    </FormControl>
                    {!isEdit && (
                      <FormDescription>
                        {isAr
                          ? "يُولَّد تلقائياً عند الحفظ"
                          : "Generated automatically on save"}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="escId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.escId")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-escId" className="text-left" dir="ltr" /></FormControl>
                    <FormDescription>
                      {isAr ? "اختياري — معرّف الجمعيّة الأوروبية" : "Optional — European Society ID"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              {/* ===== Professional ===== */}
              <FormSection
                icon={Briefcase}
                title={isAr ? "البيانات المهنيّة" : "Professional"}
                description={isAr ? "الاختصاص ونوع العضوية ومكان العمل" : "Specialty, membership type and workplace"}
              >
                <FormField control={form.control} name="specialty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.specialty")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-specialty">
                          <SelectValue placeholder={t("field.specialty")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPECIALTIES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {isAr ? s.labelAr : s.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="membershipType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.membershipType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-membershipType">
                          <SelectValue placeholder={t("field.membershipType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEMBERSHIP_TYPES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {isAr ? m.labelAr : m.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="joinDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.joinDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-joinDate" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.city")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-city" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="workAddress" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("field.workAddress")}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-workAddress" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              {/* ===== Contact ===== */}
              <FormSection
                icon={AtSign}
                title={isAr ? "بيانات التواصل" : "Contact"}
                description={isAr ? "وسائل التواصل المعتمدة" : "Preferred contact channels"}
              >
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        autoComplete="tel"
                        className="text-left"
                        dir="ltr"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("field.email")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        className="text-left"
                        dir="ltr"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              {/* ===== Footer actions (sticky on mobile) ===== */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t sticky bottom-0 -mx-6 px-6 py-4 bg-card/95 backdrop-blur-sm">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(cancelHref)}
                  disabled={isPending}
                  data-testid="button-cancel"
                >
                  {t("action.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="min-w-[160px]"
                  disabled={isPending}
                  data-testid="button-save"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {isAr ? "جارٍ الحفظ..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="me-2 h-4 w-4" />
                      {t("action.save")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
