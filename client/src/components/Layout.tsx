import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings as SettingsIcon,
  Languages,
  Moon,
  Sun,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BrandMark } from "@/components/BrandMark";
import type { User } from "@shared/schema";

const SIDEBAR_PREF_KEY = "scva.sidebar.collapsed";

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, direction } = useLanguage();
  const [location, setLocation] = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) === "1";
  });

  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_PREF_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
    } catch {
      // Even if logout fails server-side, clear client state
    }
    queryClient.setQueryData(["/api/user"], null);
    await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    setLocation("/");
  };

  const navItems: NavItem[] = [
    { href: "/", labelKey: "nav.home", icon: LayoutDashboard },
    { href: "/members", labelKey: "nav.members", icon: Users },
    { href: "/add-member", labelKey: "nav.add_member", icon: UserPlus },
  ];
  if (user?.role === "admin") {
    navItems.push({ href: "/settings", labelKey: "nav.settings", icon: SettingsIcon });
  }

  const currentNav =
    navItems.find((n) => n.href === location) ??
    (location.startsWith("/edit-member")
      ? { href: location, labelKey: "nav.add_member", icon: UserPlus }
      : location.startsWith("/member/")
      ? { href: location, labelKey: "nav.members", icon: Users }
      : null);

  /* ============ Sidebar nav ============ */
  const NavLinks = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      <nav className="flex-1 py-4 px-2 space-y-0.5" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = item.href === location;
          const Icon = item.icon;
          const link = (
            <Link key={item.href} href={item.href}>
              <div
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md text-sm font-medium cursor-pointer transition-colors",
                  isCollapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 h-10",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
                data-testid={`nav-${item.href.replace(/[^a-z0-9]/gi, "-") || "home"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && !isCollapsed && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary",
                      direction === "rtl" ? "right-0" : "left-0",
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
              </div>
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side={direction === "rtl" ? "left" : "right"}>
                  {t(item.labelKey)}
                </TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>
    </>
  );

  /* ============ Sidebar (full content) ============ */
  const SidebarBody = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-e border-sidebar-border">
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border h-16",
          isCollapsed ? "justify-center px-2" : "px-4",
        )}
      >
        {isCollapsed ? (
          <BrandMark variant="mark" size="sm" />
        ) : (
          <BrandMark variant="full" size="md" productLabel="Members" />
        )}
      </div>

      <NavLinks isCollapsed={isCollapsed} />

      {/* Collapse toggle (desktop only) */}
      <div className="hidden md:flex border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isCollapsed ? "w-full justify-center px-0" : "w-full justify-start gap-2",
          )}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={t(isCollapsed ? "nav.expand_sidebar" : "nav.collapse_sidebar")}
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs">{t("nav.collapse_sidebar")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  /* ============ Top header ============ */
  const userInitials =
    user?.username
      ?.split(/[\s._-]+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const TopBar = () => (
    <header
      className="hidden md:flex h-16 items-center gap-3 px-6 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-20 print:hidden"
      data-testid="app-header"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {currentNav && (
          <>
            <currentNav.icon
              className="h-4 w-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
            <h1 className="text-sm font-semibold text-foreground truncate">
              {t(currentNav.labelKey)}
            </h1>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              aria-label={t("nav.language_toggle")}
              data-testid="button-language"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{language === "ar" ? "English" : "العربية"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={t("nav.theme_toggle")}
              data-testid="button-theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {resolvedTheme === "dark"
              ? language === "ar" ? "الوضع الفاتح" : "Light mode"
              : language === "ar" ? "الوضع الداكن" : "Dark mode"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-2 gap-2"
              aria-label={t("nav.user_menu")}
              data-testid="button-user-menu"
            >
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {userInitials}
              </span>
              <span className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold">{user?.username}</span>
                <span className="text-[10px] text-muted-foreground">
                  {t(`role.${user?.role ?? "employee"}`)}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold">{user?.username}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {t(`role.${user?.role ?? "employee"}`)}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === "admin" && (
              <DropdownMenuItem onClick={() => setLocation("/settings")}>
                <SettingsIcon className="me-2 h-4 w-4" />
                {t("nav.settings")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
              <LogOut className="me-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">{t("nav.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background flex print:block" dir={direction}>
      {/* Skip to main content (A11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        data-testid="link-skip-to-content"
      >
        {language === "ar" ? "تخطّي إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-screen sticky top-0 z-30 print:hidden transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
        aria-label="Sidebar"
      >
        <SidebarBody isCollapsed={collapsed} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={direction === "rtl" ? "right" : "left"}
          className="p-0 w-64 border-none print:hidden"
        >
          <SidebarBody isCollapsed={false} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 flex flex-col print:block">
        {/* Mobile header */}
        <header className="md:hidden border-b h-14 flex items-center px-4 bg-card sticky top-0 z-20 print:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="-ms-2"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.open_menu")}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ms-2 flex-1 min-w-0">
            <BrandMark variant="full" size="sm" productLabel="Members" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label={t("nav.logout")}
            data-testid="button-mobile-logout"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </header>

        {/* Desktop header */}
        <TopBar />

        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 print:p-0 print:m-0 print:max-w-none focus:outline-none"
        >
          {children}
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}
