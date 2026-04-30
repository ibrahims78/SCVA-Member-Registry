import { Switch, Route } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { MembersProvider } from "@/context/MembersContext";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

import Home from "./pages/Home";
import Members from "./pages/Members";
import AddMember from "./pages/AddMember";
import MemberDetails from "./pages/MemberDetails";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

function Router() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if ((user as any).mustChangePassword) {
    return <ChangePassword />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/members" component={Members} />
        <Route path="/add-member" component={AddMember} />
        <Route path="/edit-member/:id" component={AddMember} />
        <Route path="/member/:id" component={MemberDetails} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <MembersProvider>
            <Router />
            <Toaster />
          </MembersProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
