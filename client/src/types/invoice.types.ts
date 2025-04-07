/**
 * Tipuri pentru facturi
 */

import type { InvoiceStatus } from './common.types';

// Metodă de plată
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';

// Factură
export interface Invoice {
  id: number;
  organization_id: number;
  client_id: number;
  project_id?: number | null;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  status: InvoiceStatus;
  currency: string;
  payment_terms?: string | null;
  notes?: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  client_name?: string;
  project_name?: string;
  days_overdue?: number;
  items?: InvoiceItem[];
}

// Elementele facturii
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

// Pentru adăugare/editare în UI
export interface InvoiceItemForm {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Pentru inserare în baza de date
export interface InsertInvoice {
  organization_id: number;
  client_id: number;
  project_id?: number | null;
  invoice_number: string;
  issue_date: Date | string;
  due_date: Date | string;
  status: InvoiceStatus;
  currency: string;
  payment_terms?: string | null;
  notes?: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total_amount: number;
  paid_amount?: number;
  remaining_amount: number;
  items: InsertInvoiceItem[];
}

// Pentru inserare element în baza de date
export interface InsertInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Pentru update în baza de date
export interface UpdateInvoice {
  client_id?: number;
  project_id?: number | null;
  invoice_number?: string;
  issue_date?: Date | string;
  due_date?: Date | string;
  status?: InvoiceStatus;
  currency?: string;
  payment_terms?: string | null;
  notes?: string | null;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_rate?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
}

// Plată
export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: Date;
  payment_method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  invoice_number?: string;
  client_name?: string;
}

// Pentru inserare plată în baza de date
export interface InsertPayment {
  invoice_id: number;
  amount: number;
  payment_date: Date | string;
  payment_method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

// Filtre pentru facturi
export interface InvoiceFilter {
  client_id?: number | number[];
  project_id?: number | number[];
  status?: InvoiceStatus | InvoiceStatus[];
  issue_date_from?: Date | string;
  issue_date_to?: Date | string;
  due_date_from?: Date | string;
  due_date_to?: Date | string;
  minimum_amount?: number;
  maximum_amount?: number;
  search?: string; // Caută în număr factură sau note
  is_overdue?: boolean;
}

// Statistici pentru facturi
export interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  overdue_amount: number;
  invoices_by_status: { status: InvoiceStatus; count: number; amount: number }[];
  invoices_by_client: { client_id: number; client_name: string; count: number; amount: number }[];
  monthly_invoices: { month: string; count: number; amount: number }[];
}