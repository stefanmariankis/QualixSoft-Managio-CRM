import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums from Supabase database
export const organizationTypeEnum = pgEnum('organization_type', ['freelancer', 'agency', 'company']);
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'ceo', 'manager', 'director', 'employee', 'client']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['trial', 'basic', 'pro', 'pro_yearly']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").default("ceo"),
  organizationId: integer("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  type: organizationTypeEnum("type").notNull(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("trial"),
  trialExpiresAt: timestamp("trial_expires_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Registration Schema
export const registrationSchema = z.object({
  firstName: z.string().min(1, { message: "Prenumele este obligatoriu" }),
  lastName: z.string().min(1, { message: "Numele este obligatoriu" }),
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z.string().min(8, { message: "Parola trebuie să aibă minim 8 caractere" }),
  organizationType: z.enum(["freelancer", "agency", "company"], {
    errorMap: () => ({ message: "Tipul organizației este obligatoriu" }),
  }),
  companyName: z.string().min(1, { message: "Numele organizației este obligatoriu" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Trebuie să accepți termenii și condițiile"
  })
});

export type RegistrationData = z.infer<typeof registrationSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z.string().min(1, { message: "Parola este obligatorie" }),
  rememberMe: z.boolean().optional()
});

export type LoginData = z.infer<typeof loginSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" })
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
