import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  Languages,
  User as UserIcon,
  Lock,
  KeyRound,
  Copy,
  Check,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [initialCreds, setInitialCreds] = useState<{ username: string; password: string } | null>(null);
  const [credsDismissed, setCredsDismissed] = useState(false);
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { language, setLanguage, direction } = useLanguage();

  const isAr = language === "ar";

  // One-time fetch of the freshly-generated admin password on first boot.
  // The server returns 404 once consumed; we silently ignore that case.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/initial-credentials", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { username: string; password: string };
        if (cancelled) return;
        setInitialCreds(data);
        setUsername(data.username);
        setPassword(data.password);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToClipboard = async (
    value: string,
    field: "username" | "password",
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast({
        variant: "destructive",
        title: isAr ? "تعذّر النسخ" : "Copy failed",
        description: isAr
          ? "انسخ القيمة يدوياً من الحقل."
          : "Please copy the value manually.",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setLoading(true);
    try {
      await apiRequest("POST", "/api/login", { username, password });
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message.replace(/^\d+:\s*/, "")
          : isAr
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : "Invalid username or password";
      setFieldError(message);
      toast({
        variant: "destructive",
        title: isAr ? "خطأ في تسجيل الدخول" : "Login error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const valueProps = isAr
    ? [
        { icon: ShieldCheck, title: "أمان احترافي", body: "جلسات مشفّرة وكلمات مرور محميّة وفق أفضل المعايير." },
        { icon: Stethoscope, title: "مصمَّم للأطباء", body: "تجربة مبسّطة لإدارة سجلّ العضوية والاشتراكات." },
      ]
    : [
        { icon: ShieldCheck, title: "Professional security", body: "Encrypted sessions and protected passwords by best practices." },
        { icon: Stethoscope, title: "Built for physicians", body: "A streamlined experience for managing membership and dues." },
      ];

  return (
    <div
      className="min-h-screen grid lg:grid-cols-2 bg-background"
      dir={direction}
      data-testid="page-login"
    >
      {/* ====== Left (RTL: Right) — Brand panel ====== */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-10 bg-brand-gradient text-primary-foreground overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-grid-soft opacity-[0.06]" />

        <div className="relative z-10">
          <BrandMark variant="full" size="lg" productLabel="Members" />
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <h2 className={cn("text-3xl font-bold leading-tight", isAr ? "tracking-tight" : "")}>
            {isAr ? BRAND.fullNameAr : BRAND.fullNameEn}
          </h2>
          <p className="text-base text-primary-foreground/85 leading-relaxed">
            {isAr ? BRAND.taglineAr : BRAND.taglineEn}
          </p>

          <ul className="space-y-5 stagger-fade-in">
            {valueProps.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center backdrop-blur-sm">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-primary-foreground/75 mt-0.5">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60">
          © {BRAND.year} — {isAr ? BRAND.fullNameAr : BRAND.fullNameEn}
        </div>
      </aside>

      {/* ====== Right (RTL: Left) — Form panel ====== */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile-only top brand */}
        <div className="lg:hidden mb-8">
          <BrandMark variant="full" size="lg" />
        </div>

        {/* Top-right language toggle */}
        <button
          type="button"
          onClick={() => setLanguage(isAr ? "en" : "ar")}
          className="absolute top-4 end-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          data-testid="button-language-toggle"
          aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
        >
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          {isAr ? "English" : "العربية"}
        </button>

        <div className="w-full max-w-sm space-y-6">
          <header className="space-y-2 text-center sm:text-start">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isAr ? "أهلاً بك مجدداً" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? "سجّل دخولك للمتابعة إلى لوحة التحكم"
                : "Sign in to continue to your dashboard"}
            </p>
          </header>

          {initialCreds && !credsDismissed && (
            <div
              role="status"
              className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-sm"
              data-testid="banner-initial-credentials"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {isAr
                        ? "بيانات الدخول الأوليّة للمسؤول"
                        : "Initial admin credentials"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr
                        ? "تظهر مرّة واحدة فقط. انسخها قبل الإغلاق."
                        : "Shown only once. Please copy before closing."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCredsDismissed(true)}
                  className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={isAr ? "إخفاء" : "Dismiss"}
                  data-testid="button-dismiss-credentials"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <dl className="space-y-2 text-sm">
                {(["username", "password"] as const).map((field) => (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-2 rounded-md bg-background border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {field === "username"
                          ? isAr ? "اسم المستخدم" : "Username"
                          : isAr ? "كلمة المرور" : "Password"}
                      </dt>
                      <dd
                        className="font-mono text-sm text-foreground truncate"
                        data-testid={`text-initial-${field}`}
                        dir="ltr"
                      >
                        {initialCreds[field]}
                      </dd>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(initialCreds[field], field)}
                      className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label={
                        isAr
                          ? `نسخ ${field === "username" ? "اسم المستخدم" : "كلمة المرور"}`
                          : `Copy ${field}`
                      }
                      data-testid={`button-copy-${field}`}
                    >
                      {copiedField === field ? (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                ))}
              </dl>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? "سيُطلب منك تغيير كلمة المرور فور تسجيل الدخول لأوّل مرّة."
                  : "You will be required to change this password right after your first sign-in."}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-username" className="text-sm font-medium">
                {isAr ? "اسم المستخدم" : "Username"}
              </Label>
              <div className="relative">
                <UserIcon
                  className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  className="ps-10"
                  placeholder={isAr ? "أدخل اسم المستخدم" : "Enter your username"}
                  data-testid="input-username"
                  aria-invalid={fieldError ? "true" : undefined}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">
                {isAr ? "كلمة المرور" : "Password"}
              </Label>
              <div className="relative">
                <Lock
                  className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="ps-10 pe-10"
                  placeholder={isAr ? "أدخل كلمة المرور" : "Enter your password"}
                  data-testid="input-password"
                  aria-invalid={fieldError ? "true" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={
                    showPassword
                      ? isAr ? "إخفاء كلمة المرور" : "Hide password"
                      : isAr ? "إظهار كلمة المرور" : "Show password"
                  }
                  data-testid="button-toggle-password"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {fieldError && (
              <div
                role="alert"
                className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2"
                data-testid="text-login-error"
              >
                {fieldError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-sm"
              disabled={loading || !username || !password}
              data-testid="button-login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isAr ? "جارٍ التحقّق..." : "Signing in..."}
                </>
              ) : (
                isAr ? "تسجيل الدخول" : "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-4 border-t">
            {isAr
              ? "تواجه مشكلة بالدخول؟ تواصل مع مسؤول النظام."
              : "Trouble signing in? Contact your administrator."}
          </p>
        </div>
      </main>
    </div>
  );
}
