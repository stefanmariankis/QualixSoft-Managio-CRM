import { mysqlTable, varchar, int, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums pentru MySQL
export const organizationTypes = ['freelancer', 'agency', 'company'] as const;
export const userRoles = ['super_admin', 'ceo', 'manager', 'director', 'employee', 'client'] as const;
export const subscriptionPlans = ['trial', 'basic', 'pro', 'pro_yearly'] as const;

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: mysqlEnum("role", userRoles).default("ceo"),
  organizationId: int("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Organizations table
export const organizations = mysqlTable("organizations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logo: varchar("logo", { length: 255 }),
  type: mysqlEnum("organization_type", organizationTypes).notNull(),
  subscriptionPlan: mysqlEnum("subscription_plan", subscriptionPlans).notNull().default("trial"),
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
