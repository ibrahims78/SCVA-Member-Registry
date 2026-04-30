import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

function buildSchema(isAr: boolean) {
  return z
    .object({
      newPassword: z
        .string()
        .min(
          8,
          isAr
            ? "كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف على الأقل"
            : "New password must be at least 8 characters",
        ),
      confirmPassword: z
        .string()
        .min(1, isAr ? "تأكيد كلمة المرور مطلوب" : "Password confirmation is required"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
      path: ["confirmPassword"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ChangePassword() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language, direction } = useLanguage();
  const isAr = language === "ar";

  const schema = buildSchema(isAr);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/user/change-password", values);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: isAr ? "تم تغيير كلمة المرور" : "Password changed",
        description: isAr
          ? "أهلاً بك! يمكنك الآن استخدام النظام."
          : "Welcome! You can now use the system.",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (err: Error) => {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/40 p-4"
      dir={direction}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold mb-0.5">
              {isAr ? "مطلوب تغيير كلمة المرور" : "Password change required"}
            </p>
            <p className="text-amber-700">
              {isAr
                ? "أنت تستخدم كلمة المرور الافتراضية. يجب تغييرها قبل المتابعة لضمان أمان حسابك."
                : "You are using the default password. You must change it before continuing to keep your account secure."}
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {isAr ? "تغيير كلمة المرور" : "Change password"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "اختر كلمة مرور قوية لا تقل عن 8 أحرف"
                    : "Choose a strong password of at least 8 characters"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                className="space-y-5"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isAr ? "كلمة المرور الجديدة" : "New password"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          dir="ltr"
                          className="text-left"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          dir="ltr"
                          className="text-left"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {isAr ? "جارٍ الحفظ..." : "Saving..."}
                    </>
                  ) : isAr ? (
                    "حفظ كلمة المرور والمتابعة"
                  ) : (
                    "Save password and continue"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
