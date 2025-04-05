import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "./context/auth-context";
import { AuthProvider } from "./context/auth-context";

// Lazy load pages
const AuthPage = lazy(() => import("@/pages/auth"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

function Router() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if logged in, to login if not
  useEffect(() => {
    const pathname = window.location.pathname;
    if (user && pathname === "/") {
      setLocation("/dashboard");
    } else if (!user && pathname !== "/" && !pathname.startsWith("/auth")) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Se încarcă...</div>}>
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/auth/:tab" component={AuthPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
