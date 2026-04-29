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

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePassword() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: "تم تغيير كلمة المرور",
        description: "أهلاً بك! يمكنك الآن استخدام النظام.",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (err: Error) => {
      toast({
        title: "خطأ",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/40 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold mb-0.5">مطلوب تغيير كلمة المرور</p>
            <p className="text-amber-700">
              أنت تستخدم كلمة المرور الافتراضية. يجب تغييرها قبل المتابعة
              لضمان أمان حسابك.
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
                <h1 className="text-xl font-bold">تغيير كلمة المرور</h1>
                <p className="text-sm text-muted-foreground">
                  اختر كلمة مرور قوية لا تقل عن 8 أحرف
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
                      <FormLabel>كلمة المرور الجديدة</FormLabel>
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
                      <FormLabel>تأكيد كلمة المرور</FormLabel>
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
                      جارٍ الحفظ...
                    </>
                  ) : (
                    "حفظ كلمة المرور والمتابعة"
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
