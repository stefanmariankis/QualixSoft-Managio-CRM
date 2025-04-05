import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export default function LoginForm() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      // Autentificare reușită - redirecționarea se face în AuthContext
    } catch (error) {
      // Eroarea este gestionată în AuthContext, dar putem afișa un toast aici
      toast({
        title: "Autentificare eșuată",
        description: error instanceof Error ? error.message : "Nu te-ai putut conecta. Verifică datele și încearcă din nou.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bine ai revenit!</h2>
      <p className="text-gray-500 mb-8">Autentifică-te pentru a continua în aplicația Managio</p>
      
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
                    placeholder="nume@companie.ro"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between mb-1">
                  <FormLabel>Parolă</FormLabel>
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                    Am uitat parola
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ține-mă conectat</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Se procesează..." : "Autentificare"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">sau continuă cu</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center"
            disabled={isLoading}
          >
            <i className="fab fa-google text-red-500 mr-2"></i>
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center"
            disabled={isLoading}
          >
            <i className="fab fa-microsoft text-blue-500 mr-2"></i>
            Microsoft
          </Button>
        </div>
      </div>
    </div>
  );
}
