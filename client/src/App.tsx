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
const ClientDetailsPage = lazy(() => import("@/pages/clients/[id]"));
const ProjectsPage = lazy(() => import("@/pages/projects/index"));
const ProjectDetailsPage = lazy(() => import("@/pages/projects/[id]"));
const TasksPage = lazy(() => import("@/pages/tasks/index"));
const TaskDetailsPage = lazy(() => import("@/pages/tasks/[id]"));
const TaskEditPage = lazy(() => import("@/pages/tasks/edit/[id]"));
const InvoicesPage = lazy(() => import("@/pages/invoices/index"));
const InvoiceDetailsPage = lazy(() => import("@/pages/invoices/[id]"));
const CalendarPage = lazy(() => import("@/pages/calendar/index"));
const TeamPage = lazy(() => import("@/pages/team/index"));
const TeamMemberDetailsPage = lazy(() => import("@/pages/team/[id]"));
const DepartmentsPage = lazy(() => import("@/pages/departments/index"));
const DepartmentDetailsPage = lazy(() => import("@/pages/departments/[id]"));

// Module care vor fi implementate în viitor
// Module avansate
const TemplatesPage = lazy(() => import("@/pages/templates/index"));
const ReportsPage = lazy(() => import("@/pages/reports/index"));
const SettingsPage = lazy(() => import("@/pages/settings/index"));
const AutomationPage = lazy(() => import("@/pages/automations/index"));

// Pagini statice de rezervă în caz de erori
// const TemplatesPage = () => <div>Pagina templates va fi disponibilă în curând</div>;
// const ReportsPage = () => <div>Pagina rapoarte va fi disponibilă în curând</div>;
// const SettingsPage = () => <div>Pagina setări va fi disponibilă în curând</div>;

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
        
        <ProtectedRoute path="/clients/:id">
          <ClientDetailsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/projects">
          <ProjectsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/projects/:id">
          <ProjectDetailsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/tasks">
          <TasksPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/tasks/:id">
          <TaskDetailsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/tasks/edit/:id">
          <TaskEditPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/invoices">
          <InvoicesPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/invoices/:id">
          <InvoiceDetailsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/automations">
          <AutomationPage />
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
        
        <ProtectedRoute path="/team">
          <TeamPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/team/:id">
          <TeamMemberDetailsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/departments">
          <DepartmentsPage />
        </ProtectedRoute>
        
        <ProtectedRoute path="/departments/:id">
          <DepartmentDetailsPage />
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
