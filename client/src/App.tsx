import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "./context/auth-context";
import { AuthProvider } from "./context/auth-context";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

// Lazy load pages
const AuthPage = lazy(() => import("@/pages/auth"));
const Dashboard = lazy(() => import("@/pages/dashboard"));

// Module principale
const ClientsPage = lazy(() => import("@/pages/clients/index"));
const ProjectsPage = lazy(() => import("@/pages/projects/index"));
const TasksPage = lazy(() => import("@/pages/tasks/index"));
const InvoicesPage = lazy(() => import("@/pages/invoices/index"));
const CalendarPage = lazy(() => import("@/pages/calendar/index"));

// Module care vor fi implementate
const TemplatesPage = lazy(() => import("@/pages/templates/index"));
const ReportsPage = lazy(() => import("@/pages/reports/index"));
const SettingsPage = lazy(() => import("@/pages/settings/index"));

// Component pentru rutele protejate
function ProtectedRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {user ? children : <Redirect to="/auth/login" />}
    </Route>
  );
}

function Router() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirecționăm utilizatorii autentificați către dashboard când accesează /
  useEffect(() => {
    if (user && window.location.pathname === "/") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Se încarcă...</div>}>
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/auth/:tab" component={AuthPage} />
        
        {/* Rute protejate pentru dashboard și module */}
        <ProtectedRoute path="/dashboard">
          <Dashboard />
        </ProtectedRoute>
        
        <ProtectedRoute path="/clients">
          <ClientsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/projects">
          <ProjectsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/tasks">
          <TasksPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/invoices">
          <InvoicesPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/templates">
          <TemplatesPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/reports">
          <ReportsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/calendar">
          <CalendarPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/settings">
          <SettingsPage />
        </ProtectedRoute>
        
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
