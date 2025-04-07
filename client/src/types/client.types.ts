/**
 * Tipuri pentru clienți
 */

import type { ClientSource, ClientStatus } from './common.types';

export interface Client {
  id: number;
  organization_id: number;
  name: string;
  company_name?: string | null;
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
  status: ClientStatus;
  source: ClientSource;
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
  
  // Câmpuri adiționale pentru UI
  assigned_user_name?: string;
  created_by_name?: string;
  project_count?: number;
  invoice_count?: number;
  total_revenue?: number;
}

export interface InsertClient {
  organization_id: number;
  name: string;
  company_name?: string | null;
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
  status: ClientStatus;
  source: ClientSource;
  industry?: string | null;
  assigned_to?: number | null;
  created_by: number;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo?: string | null;
}

export interface UpdateClient {
  name?: string;
  company_name?: string | null;
  email?: string;
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
  status?: ClientStatus;
  source?: ClientSource;
  industry?: string | null;
  assigned_to?: number | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  logo?: string | null;
}

export interface ClientDetailStats {
  projects: number;
  activeProjects: number;
  completedProjects: number;
  invoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  currency: string;
}