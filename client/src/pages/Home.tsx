import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useMembers } from "@/context/MembersContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
} from "recharts";
import {
  Users,
  UserPlus,
  Stethoscope,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

type Tone = "primary" | "success" | "info" | "warning";

const TONE_STYLES: Record<Tone, { bg: string; ring: string; text: string }> = {
  primary: {
    bg: "bg-primary/10",
    ring: "ring-primary/20",
    text: "text-primary",
  },
  success: {
    bg: "bg-success/10",
    ring: "ring-success/20",
    text: "text-success",
  },
  info: {
    bg: "bg-info/10",
    ring: "ring-info/20",
    text: "text-info",
  },
  warning: {
    bg: "bg-warning/10",
    ring: "ring-warning/20",
    text: "text-warning",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "primary",
  isLoading,
  testId,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  tone?: Tone;
  isLoading?: boolean;
  testId: string;
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
      data-testid={testId}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <p
                className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words"
                data-testid={`${testId}-value`}
              >
                {value}
              </p>
            )}
            {description && !isLoading && (
              <p className="mt-1 text-xs text-muted-foreground break-words">
                {description}
              </p>
            )}
            {isLoading && <Skeleton className="h-3 w-32 mt-2" />}
          </div>
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center ring-1 flex-shrink-0",
              t.bg,
              t.ring,
            )}
          >
            <Icon className={cn("h-5 w-5", t.text)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { t, language, direction } = useLanguage();
  const { members, isLoading: loading } = useMembers();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });

  const isAr = language === "ar";
  const ArrowGo = direction === "rtl" ? ArrowLeft : ArrowRight;

  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalOriginal = members.filter((m) => m.membershipType === "original").length;
    const totalAssociate = members.filter((m) => m.membershipType === "associate").length;

    const specialtyStats = members.reduce<Record<string, number>>((acc, m) => {
      const key = m.specialty ?? "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMembers,
      totalOriginal,
      totalAssociate,
      specialtyStats,
    };
  }, [members]);

  const chartData = useMemo(
    () =>
      Object.entries(stats.specialtyStats).map(([key, value]) => ({
        name: t(`val.${key}`) || key,
        count: value,
      })),
    [stats.specialtyStats, t],
  );

  const recentSubs = useMemo(
    () =>
      members
        .flatMap((m) =>
          m.subscriptions.map((s) => ({
            ...s,
            memberName: m.fullName,
            memberId: m.id,
          })),
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [members],
  );

  const todayLabel = new Date().toLocaleDateString(isAr ? "ar-SY" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ===== Welcome header ===== */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{todayLabel}</span>
          </p>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid="text-welcome"
          >
            {isAr ? `مرحباً، ${user?.username ?? "بك"} 👋` : `Welcome, ${user?.username ?? "back"} 👋`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "نظرة سريعة على حالة عضوية الجمعيّة اليوم"
              : "A quick overview of your association today"}
          </p>
        </div>
        <Link href="/add-member">
          <Button size="lg" className="shadow-sm" data-testid="button-add-member-cta">
            <UserPlus className="me-2 h-4 w-4" />
            {t("nav.add_member")}
          </Button>
        </Link>
      </header>

      {/* ===== Stat cards ===== */}
      <section
        className="grid gap-4 sm:grid-cols-2"
        aria-label={isAr ? "إحصاءات سريعة" : "Quick stats"}
      >
        <StatCard
          title={isAr ? "إجمالي الأعضاء" : "Total members"}
          value={stats.totalMembers}
          icon={Users}
          description={
            isAr
              ? `${stats.totalOriginal} أصيل · ${stats.totalAssociate} مشارك`
              : `${stats.totalOriginal} original · ${stats.totalAssociate} associate`
          }
          tone="primary"
          isLoading={loading}
          testId="stat-total-members"
        />
        <StatCard
          title={isAr ? "أعضاء أصلاء" : "Original members"}
          value={stats.totalOriginal}
          icon={Stethoscope}
          description={
            stats.totalMembers > 0
              ? `${Math.round((stats.totalOriginal / stats.totalMembers) * 100)}%`
              : "—"
          }
          tone="info"
          isLoading={loading}
          testId="stat-original"
        />
      </section>

      {/* ===== Charts + recent activity ===== */}
      <section className="grid gap-4 lg:grid-cols-7">
        {/* Specialty bar chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {isAr ? "توزيع الاختصاصات" : "Specialty distribution"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "عدد الأعضاء حسب التخصّص الطبّي"
                  : "Members by medical specialty"}
              </p>
            </div>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : chartData.length === 0 ? (
              <EmptyHint
                icon={Inbox}
                text={isAr ? "لا توجد بيانات بعد" : "No data yet"}
              />
            ) : (
              <div className="h-[260px]" data-testid="chart-specialty">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ReTooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      contentStyle={{
                        borderRadius: "var(--radius-md, 0.5rem)",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      barSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {isAr ? "آخر الاشتراكات" : "Recent payments"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isAr ? "أحدث ٦ معاملات اشتراك" : "Latest 6 subscription entries"}
              </p>
            </div>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            ) : recentSubs.length === 0 ? (
              <EmptyHint
                icon={Inbox}
                text={isAr ? "لا توجد اشتراكات بعد" : "No payments yet"}
              />
            ) : (
              <ul className="space-y-1" data-testid="list-recent-subs">
                {recentSubs.map((sub) => (
                  <li key={sub.id}>
                    <Link href={`/member/${sub.memberId}`}>
                      <div
                        className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
                        data-testid={`row-recent-sub-${sub.id}`}
                      >
                        <span className="h-9 w-9 rounded-full bg-success/15 text-success flex items-center justify-center flex-shrink-0 ring-1 ring-success/20">
                          <Wallet className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {sub.memberName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sub.year} · {sub.date}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                          {sub.amount.toLocaleString(isAr ? "ar-SY" : "en-US")}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {recentSubs.length > 0 && (
              <div className="pt-3 mt-2 border-t">
                <Link href="/members">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs"
                    data-testid="button-view-all-members"
                  >
                    <span>
                      {isAr ? "عرض كلّ الأعضاء" : "View all members"}
                    </span>
                    <ArrowGo className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
