export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  organization_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  organization_type: 'freelancer' | 'agency' | 'company';
  subscription_plan: 'trial' | 'basic' | 'pro' | 'pro_yearly';
  trial_expires_at: Date | null;
  subscription_started_at: Date | null;
  subscription_expires_at: Date | null;
  is_active: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
}

export interface OrganizationData {
  name: string;
  type: 'freelancer' | 'agency' | 'company';
}

export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong'
}
