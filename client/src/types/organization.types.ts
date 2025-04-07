/**
 * Tipuri pentru organizații
 */

import type { OrganizationType, SubscriptionPlan } from './common.types';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  organization_type: OrganizationType;
  subscription_plan: SubscriptionPlan;
  trial_expires_at: Date | null;
  subscription_started_at: Date | null;
  subscription_expires_at: Date | null;
  is_active: boolean;
  has_departments: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface InsertOrganization {
  name: string;
  slug: string;
  logo?: string | null;
  organization_type: OrganizationType;
  subscription_plan?: SubscriptionPlan;
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active?: boolean;
  has_departments?: boolean;
}

export interface UpdateOrganization {
  name?: string;
  slug?: string;
  logo?: string | null;
  organization_type?: OrganizationType;
  subscription_plan?: SubscriptionPlan;
  trial_expires_at?: Date | null;
  subscription_started_at?: Date | null;
  subscription_expires_at?: Date | null;
  is_active?: boolean;
  has_departments?: boolean;
}

export interface OrganizationSettings {
  id: number;
  organization_id: number;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  smtp_password?: string | null;
  smtp_secure?: boolean;
  email_from?: string | null;
  default_currency?: string;
  default_language?: string;
  date_format?: string;
  time_format?: string;
  timezone?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateOrganizationSettings {
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_username?: string | null;
  smtp_password?: string | null;
  smtp_secure?: boolean;
  email_from?: string | null;
  default_currency?: string;
  default_language?: string;
  date_format?: string;
  time_format?: string;
  timezone?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}