/**
 * Tipuri pentru utilizatori
 */

import type { UserRole } from './common.types';

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  name?: string | null;
  role: UserRole;
  is_active: boolean;
  organization_id?: number | null;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  organization_name?: string;
  full_name?: string;
  avatar?: string | null;
}

export interface InsertUser {
  username: string;
  password: string;
  email: string;
  name?: string | null;
  role: UserRole;
  is_active?: boolean;
  organization_id?: number | null;
}

export interface UpdateUser {
  username?: string;
  email?: string;
  name?: string | null;
  role?: UserRole;
  is_active?: boolean;
  organization_id?: number | null;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export interface UserFilter {
  role?: UserRole[];
  is_active?: boolean;
  organization_id?: number[];
  search?: string; // Caută în username, email sau nume
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  by_role: { [key in UserRole]: number };
}