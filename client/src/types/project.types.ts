/**
 * Tipuri pentru proiecte
 */

import type { Priority, ProjectStatus } from './common.types';

export interface Project {
  id: number;
  organization_id: number;
  client_id: number;
  name: string;
  description?: string | null;
  start_date: Date;
  due_date?: Date | null;
  end_date?: Date | null;
  status: ProjectStatus;
  priority: Priority;
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
  
  // Câmpuri adiționale pentru UI
  client_name?: string;
  manager_name?: string;
  task_count?: number;
  completed_task_count?: number;
}

export interface InsertProject {
  organization_id: number;
  client_id: number;
  name: string;
  description?: string | null;
  start_date: Date;
  due_date?: Date | null;
  end_date?: Date | null;
  status: ProjectStatus;
  priority: Priority;
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

export interface UpdateProject {
  client_id?: number;
  name?: string;
  description?: string | null;
  start_date?: Date;
  due_date?: Date | null;
  end_date?: Date | null;
  status?: ProjectStatus;
  priority?: Priority;
  category?: string | null;
  budget?: number | null;
  currency?: string | null;
  hourly_rate?: number | null;
  estimated_hours?: number | null;
  completion_percentage?: number;
  manager_id?: number | null;
  is_fixed_price?: boolean;
  notes?: string | null;
}

export interface ProjectFilter {
  status?: ProjectStatus[];
  priority?: Priority[];
  client_id?: number[];
  manager_id?: number[];
  start_date_range?: { from: Date; to: Date };
  due_date_range?: { from: Date; to: Date };
  budget_range?: { min: number; max: number };
}

export interface ProjectStats {
  total: number;
  not_started: number;
  in_progress: number;
  on_hold: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

export interface InsertProjectMember {
  project_id: number;
  user_id: number;
  role: string;
}