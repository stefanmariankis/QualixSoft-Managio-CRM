import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { Link } from "wouter";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export default function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    }
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Nu s-a putut trimite email-ul de resetare. Încearcă din nou.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resetează parola</h2>
      <p className="text-gray-500 mb-8">Introdu adresa de email pentru a primi un link de resetare a parolei</p>
      
      {isSuccess ? (
        <div className="space-y-6">
          <Alert className="bg-green-50 border border-green-100">
            <AlertDescription className="text-green-600">
              Un email cu instrucțiuni pentru resetarea parolei a fost trimis. Verifică căsuța de email.
            </AlertDescription>
          </Alert>
          
          <Link href="/auth/login" className="w-full">
            <Button className="w-full">Înapoi la autentificare</Button>
          </Link>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="nume@companie.ro"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Se procesează..." : "Trimite link de resetare"}
            </Button>
            
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">Înapoi la autentificare</Button>
            </Link>
          </form>
        </Form>
      )}
    </div>
  );
}
