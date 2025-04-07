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

export const teamMemberRoles = [
  "administrator", 
  "manager", 
  "angajat", 
  "colaborator", 
  "asociat"
] as const;
export const subscriptionPlans = [
  "trial",
  "basic",
  "pro",
  "pro_yearly",
] as const;
export const projectStatusOptions = [
  "not_started", 
  "in_progress", 
  "on_hold", 
  "completed", 
  "cancelled"
] as const;
export const projectPriorityOptions = [
  "low",
  "medium",
  "high",
  "urgent"
] as const;
export const taskStatusOptions = [
  "not_started",
  "in_progress",
  "under_review",
  "completed",
  "cancelled",
  "on_hold"
] as const;
export const taskPriorityOptions = [
  "low",
  "medium",
  "high",
  "urgent"
] as const;
export const invoiceStatusOptions = [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled"
] as const;
export const clientSourceOptions = [
  "referral",
  "direct",
  "social_media",
  "website",
  "advertising",
  "other"
] as const;
export const clientStatusOptions = [
  "lead",
  "prospect",
  "active",
  "inactive",
  "former"
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
  organization_type: (typeof organizationTypes)[number];
  subscription_plan: (typeof subscriptionPlans)[number];
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active: boolean;
  has_departments: boolean; // Flag pentru activarea departamentelor
  created_at?: Date | null;
  updated_at?: Date | null;
}

// Tipul pentru date de inserare Organizație
export interface InsertOrganization {
  name: string;
  slug: string;
  logo?: string | null;
  organization_type: (typeof organizationTypes)[number];
  subscription_plan?: (typeof subscriptionPlans)[number];
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active?: boolean;
  has_departments?: boolean;
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

// Tipuri pentru Client
export interface Client {
  id: number;
  organization_id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  postal_code?: string | null;
  vat_number?: string | null;
  registration_number?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  notes?: string | null;
  status: (typeof clientStatusOptions)[number];
  source: (typeof clientSourceOptions)[number];
  industry?: string | null;
  assigned_to?: number | null;
  created_by: number;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertClient {
  organization_id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  postal_code?: string | null;
  vat_number?: string | null;
  registration_number?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  notes?: string | null;
  status: (typeof clientStatusOptions)[number];
  source: (typeof clientSourceOptions)[number];
  industry?: string | null;
  assigned_to?: number | null;
  created_by: number;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo?: string | null;
}

// Tipuri pentru Project
export interface Project {
  id: number;
  organization_id: number;
  client_id: number;
  name: string;
  description?: string | null;
  start_date: Date;
  due_date?: Date | null;
  end_date?: Date | null;
  status: (typeof projectStatusOptions)[number];
  priority: (typeof projectPriorityOptions)[number];
  category?: string | null;
  budget?: number | null;
  currency?: string | null;
  hourly_rate?: number | null;
  estimated_hours?: number | null;
  completion_percentage: number;
  manager_id?: number | null;
  is_fixed_price: boolean;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertProject {
  organization_id: number;
  client_id: number;
  name: string;
  description?: string | null;
  start_date: Date;
  due_date?: Date | null;
  end_date?: Date | null;
  status: (typeof projectStatusOptions)[number];
  priority: (typeof projectPriorityOptions)[number];
  category?: string | null;
  budget?: number | null;
  currency?: string | null;
  hourly_rate?: number | null;
  estimated_hours?: number | null;
  completion_percentage?: number;
  manager_id?: number | null;
  is_fixed_price: boolean;
  notes?: string | null;
}

// Tipuri pentru Task
export interface Task {
  id: number;
  organization_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: (typeof taskStatusOptions)[number];
  priority: (typeof taskPriorityOptions)[number];
  assigned_to?: number | null;
  created_by: number;
  start_date?: Date | null;
  due_date?: Date | null;
  estimated_hours?: number | null;
  completion_percentage: number;
  parent_task_id?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertTask {
  organization_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: (typeof taskStatusOptions)[number];
  priority: (typeof taskPriorityOptions)[number];
  assigned_to?: number | null;
  created_by: number;
  start_date?: Date | null;
  due_date?: Date | null;
  estimated_hours?: number | null;
  completion_percentage?: number;
  parent_task_id?: number | null;
}

// Tipuri pentru Invoice
export interface Invoice {
  id: number;
  organization_id: number;
  client_id: number;
  project_id?: number | null;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  subtotal: number;
  tax_rate?: number | null;
  tax_amount: number;
  discount_rate?: number | null;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: (typeof invoiceStatusOptions)[number];
  payment_terms?: string | null;
  notes?: string | null;
  currency: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Tipuri pentru InvoiceItem
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_index?: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertInvoiceItem {
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_index?: number;
}

export interface InsertInvoice {
  organization_id: number;
  client_id: number;
  project_id?: number | null;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  subtotal: number;
  tax_rate?: number | null;
  tax_amount: number;
  discount_rate?: number | null;
  discount_amount: number;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  status: (typeof invoiceStatusOptions)[number];
  payment_terms?: string | null;
  notes?: string | null;
  currency: string;
  created_by: number;
}

// Tipuri pentru TimeLog
export interface TimeLog {
  id: number;
  organization_id: number;
  user_id: number;
  project_id: number;
  task_id?: number | null;
  date: Date;
  hours: number;
  description?: string | null;
  is_billable: boolean;
  hourly_rate?: number | null;
  approved_by?: number | null;
  approved_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface InsertTimeLog {
  organization_id: number;
  user_id: number;
  project_id: number;
  task_id?: number | null;
  date: Date;
  hours: number;
  description?: string | null;
  is_billable: boolean;
  hourly_rate?: number | null;
  approved_by?: number | null;
  approved_at?: Date | null;
}

// Enums pentru Automatizări
export const automationActionTypes = [
  "send_notification", 
  "change_status", 
  "assign_user", 
  "send_email", 
  "create_task", 
  "add_tag"
] as const;

export const automationExecutionStatuses = [
  "success", 
  "failed", 
  "pending"
] as const;

export const automationTriggerTypes = [
  "task_status_change", 
  "deadline_approaching", 
  "invoice_overdue", 
  "time_threshold_reached", 
  "new_comment", 
  "file_upload"
] as const;

// Tipuri pentru Automation
export interface Automation {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  trigger_types: (typeof automationTriggerTypes)[number][];
  action_types: (typeof automationActionTypes)[number][];
  execution_count: number;
  last_execution_status: (typeof automationExecutionStatuses)[number] | null;
  last_execution_time: Date | null;
}

export interface InsertAutomation {
  organization_id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_by: number;
  trigger_types: (typeof automationTriggerTypes)[number][];
  action_types: (typeof automationActionTypes)[number][];
}

// Tipuri pentru AutomationTrigger
export interface AutomationTrigger {
  id: number;
  automation_id: number;
  trigger_type: (typeof automationTriggerTypes)[number];
  entity_type: string;
  conditions: any;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertAutomationTrigger {
  automation_id: number;
  trigger_type: (typeof automationTriggerTypes)[number];
  entity_type: string;
  conditions: any;
  order_index: number;
}

// Tipuri pentru AutomationAction
export interface AutomationAction {
  id: number;
  automation_id: number;
  action_type: (typeof automationActionTypes)[number];
  action_config: any;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertAutomationAction {
  automation_id: number;
  action_type: (typeof automationActionTypes)[number];
  action_config: any;
  order_index: number;
}

// Tipuri pentru AutomationLog
export interface AutomationLog {
  id: number;
  automation_id: number;
  trigger_id: number | null;
  entity_type: string;
  entity_id: number;
  execution_status: (typeof automationExecutionStatuses)[number];
  error_message: string | null;
  executed_at: Date;
  created_at: Date;
}

export interface InsertAutomationLog {
  automation_id: number;
  trigger_id?: number | null;
  entity_type: string;
  entity_id: number;
  execution_status: (typeof automationExecutionStatuses)[number];
  error_message?: string | null;
}

// Tipuri pentru ActivityLog
export interface ActivityLog {
  id: number;
  organization_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: string;  // Câmpul efectiv din baza de date
  action_type?: string;  // Pentru compatibilitate
  metadata?: any;
  created_at: Date;
}

export interface InsertActivityLog {
  organization_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: string;  // Câmpul efectiv din baza de date
  metadata?: any;
}

// Tipuri pentru Departament
export interface Department {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertDepartment {
  organization_id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  created_by: number;
}

// Tipuri pentru membri echipei
export interface TeamMember {
  id: number;
  organization_id: number;
  user_id?: number | null;  // ID-ul utilizatorului din tabelul users, dacă există
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: (typeof teamMemberRoles)[number];
  position?: string | null;
  bio?: string | null;
  avatar?: string | null;
  hourly_rate?: number | null;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface InsertTeamMember {
  organization_id: number;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: (typeof teamMemberRoles)[number];
  position?: string | null;
  bio?: string | null;
  avatar?: string | null;
  hourly_rate?: number | null;
  is_active?: boolean;
  created_by: number;
}

// Tipuri pentru asocierea membrilor cu departamente
export interface DepartmentMember {
  id: number;
  department_id: number;
  team_member_id: number;
  is_manager: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InsertDepartmentMember {
  department_id: number;
  team_member_id: number;
  is_manager?: boolean;
}

// Schema validare client
export const clientSchema = z.object({
  name: z.string().min(1, { message: "Numele este obligatoriu" }),
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  registration_number: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(clientStatusOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Status invalid" }),
  }),
  source: z.enum(clientSourceOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Sursă invalidă" }),
  }),
  industry: z.string().optional().nullable(),
  assigned_to: z.number().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email({ message: "Email de contact invalid" }).optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Schema validare proiect
export const projectSchema = z.object({
  client_id: z.number({ message: "Clientul este obligatoriu" }),
  name: z.string().min(1, { message: "Numele proiectului este obligatoriu" }),
  description: z.string().optional().nullable(),
  start_date: z.date({ message: "Data de început este obligatorie" }),
  due_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  status: z.enum(projectStatusOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Status invalid" }),
  }),
  priority: z.enum(projectPriorityOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Prioritate invalidă" }),
  }),
  category: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  currency: z.string().optional().nullable(),
  hourly_rate: z.number().nonnegative().optional().nullable(),
  estimated_hours: z.number().nonnegative().optional().nullable(),
  completion_percentage: z.number().min(0).max(100).default(0),
  manager_id: z.number().optional().nullable(),
  is_fixed_price: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// Schema validare task
export const taskSchema = z.object({
  project_id: z.number({ message: "Proiectul este obligatoriu" }),
  title: z.string().min(1, { message: "Titlul este obligatoriu" }),
  description: z.string().optional().nullable(),
  status: z.enum(taskStatusOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Status invalid" }),
  }),
  priority: z.enum(taskPriorityOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Prioritate invalidă" }),
  }),
  assigned_to: z.number().optional().nullable(),
  start_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  estimated_hours: z.number().nonnegative().optional().nullable(),
  completion_percentage: z.number().min(0).max(100).default(0),
  parent_task_id: z.number().optional().nullable(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

// Schema validare factură
export const invoiceSchema = z.object({
  client_id: z.number({ message: "Clientul este obligatoriu" }),
  project_id: z.number().optional().nullable(),
  invoice_number: z.string().min(1, { message: "Numărul facturii este obligatoriu" }),
  issue_date: z.date({ message: "Data emiterii este obligatorie" }),
  due_date: z.date({ message: "Data scadenței este obligatorie" }),
  subtotal: z.number().nonnegative({ message: "Subtotalul trebuie să fie un număr pozitiv" }),
  tax_rate: z.number().nonnegative().optional().nullable(),
  tax_amount: z.number().nonnegative(),
  discount_rate: z.number().nonnegative().optional().nullable(),
  discount_amount: z.number().nonnegative(),
  total_amount: z.number().nonnegative({ message: "Suma totală trebuie să fie un număr pozitiv" }),
  paid_amount: z.number().nonnegative().default(0),
  remaining_amount: z.number().nonnegative(),
  status: z.enum(invoiceStatusOptions as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Status invalid" }),
  }),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  currency: z.string().min(1, { message: "Moneda este obligatorie" }),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Schema validare timelog
export const timeLogSchema = z.object({
  project_id: z.number({ message: "Proiectul este obligatoriu" }),
  task_id: z.number().optional().nullable(),
  date: z.date({ message: "Data este obligatorie" }),
  hours: z.number().positive({ message: "Numărul de ore trebuie să fie pozitiv" }),
  description: z.string().optional().nullable(),
  is_billable: z.boolean().default(true),
  hourly_rate: z.number().nonnegative().optional().nullable(),
});

export type TimeLogFormData = z.infer<typeof timeLogSchema>;

// Schema validare automatizări
export const automationSchema = z.object({
  name: z.string().min(1, { message: "Numele este obligatoriu" }),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  trigger_type: z.enum(automationTriggerTypes as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Tip declanșator invalid" }),
  }),
  action_type: z.enum(automationActionTypes as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Tip acțiune invalid" }),
  }),
});

export type AutomationFormData = z.infer<typeof automationSchema>;

// Schema validare departament
export const departmentSchema = z.object({
  name: z.string().min(1, { message: "Numele departamentului este obligatoriu" }),
  description: z.string().optional().nullable(),
  manager_id: z.number().optional().nullable(),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

// Schema validare membru echipă
export const teamMemberSchema = z.object({
  first_name: z.string().min(1, { message: "Prenumele este obligatoriu" }),
  last_name: z.string().min(1, { message: "Numele este obligatoriu" }),
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  phone: z.string().optional().nullable(),
  role: z.enum(teamMemberRoles as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Rol invalid" }),
  }),
  position: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  hourly_rate: z.number().nonnegative().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;
