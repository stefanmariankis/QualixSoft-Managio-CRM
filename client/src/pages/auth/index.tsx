import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import AuthLayout from "@/components/layout/auth-layout";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [, params] = useRoute('/auth/:tab');
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  
  const tab = params?.tab || 'login';
  
  // Dacă utilizatorul este autentificat, redirecționăm către dashboard
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  // Handle invalid tabs
  useEffect(() => {
    if (tab !== 'login' && tab !== 'register' && tab !== 'forgot-password') {
      setLocation('/auth/login');
    }
  }, [tab, setLocation]);
  
  // Afișăm un indicator de încărcare în timpul verificării sesiunii
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <AuthLayout activeTab={tab as 'login' | 'register' | 'forgot-password'}>
      {tab === 'login' && <LoginForm />}
      {tab === 'register' && <RegisterForm />}
      {tab === 'forgot-password' && <ForgotPasswordForm />}
    </AuthLayout>
  );
}
