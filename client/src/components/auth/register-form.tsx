import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationData } from "@shared/schema";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import PasswordStrength from "@/components/ui/password-strength";
import { apiRequest } from "@/lib/queryClient";
import { PasswordStrength as PasswordStrengthEnum } from "@/types";

export default function RegisterForm() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthEnum>(PasswordStrengthEnum.WEAK);

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationType: "freelancer",
      companyName: "",
      termsAccepted: false
    }
  });

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    
    // Evaluate password strength
    if (!password || password.length < 8) {
      setPasswordStrength(PasswordStrengthEnum.WEAK);
    } else if (password.length >= 8 && password.length < 12) {
      setPasswordStrength(PasswordStrengthEnum.MEDIUM);
    } else {
      setPasswordStrength(PasswordStrengthEnum.STRONG);
    }
    
    // Update form value
    form.setValue("password", password);
  };

  const onSubmit = async (data: RegistrationData) => {
    try {
      setIsLoading(true);
      
      // First create the organization
      const orgResponse = await apiRequest("POST", "/api/organizations", {
        name: data.companyName,
        type: data.organizationType,
      });

      if (!orgResponse.ok) {
        throw new Error("Eroare la crearea organizației");
      }

      const organization = await orgResponse.json();
      
      // Then register the user with Supabase
      await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: organization.id,
        role: "ceo", // Default role for new registrations
      });
      
      // Înregistrare reușită - mesaj de succes afișat în AuthContext
    } catch (error) {
      toast({
        title: "Înregistrare eșuată",
        description: error instanceof Error ? error.message : "Nu s-a putut crea contul. Încearcă din nou.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Creează un cont nou</h2>
      <p className="text-gray-500 mb-8">Înregistrează-te pentru a începe să folosești Managio</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prenume</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ion"
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nume</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Popescu"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
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
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Parolă</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Minim 8 caractere"
                    {...field}
                    onChange={onPasswordChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <PasswordStrength strength={passwordStrength} />
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="organizationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipul organizației</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează tipul organizației" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="agency">Agenție</SelectItem>
                    <SelectItem value="company">Companie</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numele organizației</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Numele afacerii tale"
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
            name="termsAccepted"
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
                  <FormLabel className="font-normal text-sm text-gray-500">
                    Sunt de acord cu <span className="text-primary hover:underline cursor-pointer">Termenii și Condițiile</span> și <span className="text-primary hover:underline cursor-pointer">Politica de Confidențialitate</span>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Se procesează..." : "Creează cont"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
