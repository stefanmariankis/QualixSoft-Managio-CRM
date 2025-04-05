export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    firstName?: string;
    lastName?: string;
    organizationId?: number;
    role?: string;
  };
}

export interface AuthState {
  user: SupabaseUser | null;
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
