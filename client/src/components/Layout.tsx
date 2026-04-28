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
  HeartPulse,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, direction } = useLanguage();
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    await queryClient.setQueryData(["/api/user"], null);
    await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    setLocation("/");
  };

  const navItems = [
    { href: "/", label: 'nav.home', icon: LayoutDashboard },
    { href: "/members", label: 'nav.members', icon: Users },
    { href: "/add-member", label: 'nav.add_member', icon: UserPlus },
  ];

  if (user?.role === "admin") {
    navItems.push({ href: "/settings", label: 'nav.settings', icon: SettingsIcon });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <div className="flex-shrink-0">
          <img src="/src/assets/logo.jpg" alt="SCVA Logo" className="h-12 w-12 object-contain rounded-full border border-primary/20" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">SCVA</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Members</p>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
          <Link key={item.href} href={item.href}>
            <div 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-1 cursor-pointer",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {t(item.label)}
            </div>
          </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between p-2 rounded-md bg-sidebar-accent/50">
          <span className="text-xs font-medium text-muted-foreground">{user?.username} ({user?.role === 'admin' ? 'مدير' : 'موظف'})</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 justify-start gap-2 h-9"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs">{language === 'ar' ? 'English' : 'عربي'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex print:block" dir={direction}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 bg-card border-e z-30 print:hidden">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side={direction === 'rtl' ? 'right' : 'left'} className="p-0 w-64 border-none print:hidden">
          <NavContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 flex flex-col print:block">
        {/* Mobile Header */}
        <header className="md:hidden border-b h-14 flex items-center px-4 bg-card sticky top-0 z-20 print:hidden">
          <Button variant="ghost" size="icon" className="-ms-2" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ms-2 flex items-center gap-2">
            <img src="/src/assets/logo.jpg" alt="SCVA Logo" className="h-8 w-8 object-contain rounded-full" />
            <span className="font-semibold">{t('app.title')}</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0 print:m-0 print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
