import { useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import AuthLayout from "@/components/layout/auth-layout";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function AuthPage() {
  const [, params] = useRoute('/auth/:tab');
  const [, setLocation] = useLocation();
  
  const tab = params?.tab || 'login';
  
  // Handle invalid tabs
  useEffect(() => {
    if (tab !== 'login' && tab !== 'register' && tab !== 'forgot-password') {
      setLocation('/auth/login');
    }
  }, [tab, setLocation]);
  
  return (
    <AuthLayout activeTab={tab as 'login' | 'register' | 'forgot-password'}>
      {tab === 'login' && <LoginForm />}
      {tab === 'register' && <RegisterForm />}
      {tab === 'forgot-password' && <ForgotPasswordForm />}
    </AuthLayout>
  );
}
