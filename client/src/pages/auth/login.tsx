import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthLayout from "@/components/layout/auth-layout";
import LoginForm from "@/components/auth/login-form";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  return (
    <AuthLayout activeTab="login">
      <LoginForm />
    </AuthLayout>
  );
}
