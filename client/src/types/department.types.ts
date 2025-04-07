/**
 * Tipuri pentru departamente
 */

export interface Department {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  manager_name?: string;
  member_count?: number;
  created_by_name?: string;
}

export interface InsertDepartment {
  organization_id: number;
  name: string;
  description?: string | null;
  manager_id?: number | null;
  created_by: number;
  member_ids?: number[]; // Pentru adăugare imediată a membrilor
}

export interface UpdateDepartment {
  name?: string;
  description?: string | null;
  manager_id?: number | null;
}

export interface DepartmentMember {
  id: number;
  department_id: number;
  team_member_id: number;
  is_manager: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  member_name?: string;
  member_email?: string;
  member_avatar?: string;
  member_role?: string;
}

export interface InsertDepartmentMember {
  department_id: number;
  team_member_id: number;
  is_manager: boolean;
}

export interface DepartmentProject {
  id: number;
  department_id: number;
  project_id: number;
  created_at: Date;
  
  // Câmpuri adiționale pentru UI
  project_name?: string;
  project_status?: string;
  client_name?: string;
}

export interface InsertDepartmentProject {
  department_id: number;
  project_id: number;
}

export interface DepartmentStats {
  total: number;
  member_count: number;
  project_count: number;
  task_count: number;
}

export interface DepartmentFilter {
  manager_id?: number[];
  search?: string;
}