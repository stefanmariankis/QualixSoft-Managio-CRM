import { z } from "zod";

// Definim tipurile de bază pentru utilizarea în aplicație
// Acestea corespund cu structura tabelelor din baza de date

// Enums
export const organizationTypes = ["freelancer", "agency", "company"] as const;
export const userRoles = [
  "super_admin",
  "ceo",
  "manager",
  "director",
  "employee",
  "client",
] as const;
export const subscriptionPlans = [
  "trial",
  "basic",
  "pro",
  "pro_yearly",
] as const;

// Tipul pentru User
export interface User {
  id: number;
  email: string;
  password: string;
  first_name: string | null;
  last_name: string | null;
  role: (typeof userRoles)[number];
  organization_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Tipul pentru date de inserare User
export interface InsertUser {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: (typeof userRoles)[number];
  organizationId?: number | null;
}

// Tipul pentru organizație
export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  subscription_plan: (typeof subscriptionPlans)[number];
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active: boolean;
  created_at?: Date | null;
  updated_at?: Date | null;
}

// Tipul pentru date de inserare Organizație
export interface InsertOrganization {
  name: string;
  slug: string;
  logo?: string | null;
  subscription_plan?: (typeof subscriptionPlans)[number];
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active?: boolean;
}

// Schema pentru validare înregistrare
export const registrationSchema = z.object({
  firstName: z.string().min(1, { message: "Prenumele este obligatoriu" }),
  lastName: z.string().min(1, { message: "Numele este obligatoriu" }),
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z
    .string()
    .min(8, { message: "Parola trebuie să aibă minim 8 caractere" }),
  organizationType: z.enum(["freelancer", "agency", "company"], {
    errorMap: () => ({ message: "Tipul organizației este obligatoriu" }),
  }),
  companyName: z
    .string()
    .min(1, { message: "Numele organizației este obligatoriu" }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Trebuie să accepți termenii și condițiile",
  }),
});

export type RegistrationData = z.infer<typeof registrationSchema>;

// Schema pentru validare login
export const loginSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z.string().min(1, { message: "Parola este obligatorie" }),
  rememberMe: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

// Schema pentru resetare parolă
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" }),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
