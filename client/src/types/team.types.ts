/**
 * Tipuri pentru management-ul echipei
 */

import type { TeamMemberRole } from './common.types';

export interface TeamMember {
  id: number;
  organization_id: number;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: TeamMemberRole;
  position?: string | null;
  bio?: string | null;
  avatar?: string | null;
  hourly_rate?: number | null;
  is_active: boolean;
  password_set: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  full_name?: string;
  department_ids?: number[];
  department_names?: string[];
  created_by_name?: string;
  project_count?: number;
  task_count?: number;
}

export interface InsertTeamMember {
  organization_id: number;
  user_id?: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: TeamMemberRole;
  position?: string | null;
  bio?: string | null;
  avatar?: string | null;
  hourly_rate?: number | null;
  is_active?: boolean;
  password_set?: boolean;
  created_by: number;
  department_ids?: number[]; // Pentru adăugare în departamente
}

export interface UpdateTeamMember {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  role?: TeamMemberRole;
  position?: string | null;
  bio?: string | null;
  avatar?: string | null;
  hourly_rate?: number | null;
  is_active?: boolean;
  department_ids?: number[]; // Pentru actualizare departamente
}

export interface TeamMemberFilter {
  role?: TeamMemberRole[];
  department_id?: number[];
  is_active?: boolean;
  search?: string;
}

export interface TeamMemberInvitation {
  id: number;
  organization_id: number;
  email: string;
  role: TeamMemberRole;
  token: string;
  expires_at: Date;
  created_by: number;
  created_at: Date;
  
  // Câmpuri adiționale pentru UI
  created_by_name?: string;
  is_expired?: boolean;
}

export interface InsertTeamMemberInvitation {
  organization_id: number;
  email: string;
  role: TeamMemberRole;
  created_by: number;
}

export interface TeamMemberStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  managers: number;
  employees: number;
  collaborators: number;
  associates: number;
}

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
  
  // Câmpuri adiționale pentru UI
  user_name?: string;
  project_name?: string;
  task_name?: string;
  approved_by_name?: string;
  billable_amount?: number;
}

export interface InsertTimeLog {
  organization_id: number;
  user_id: number;
  project_id: number;
  task_id?: number | null;
  date: Date;
  start_time?: string; // Pentru pontaj cu oră de început
  end_time?: string;   // Pentru pontaj cu oră de sfârșit
  hours: number;
  description?: string | null;
  is_billable: boolean;
  hourly_rate?: number | null;
}