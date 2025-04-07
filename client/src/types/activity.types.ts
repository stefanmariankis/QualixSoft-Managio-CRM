/**
 * Tipuri pentru jurnalul de activitate
 */

export interface ActivityLog {
  id: number;
  organization_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  entity_name?: string; // Pentru UI, numele entității (ex: nume proiect, client, etc.)
  action: string;
  metadata?: any; // Metadata pentru acțiuni specifice
  created_at: Date;
  
  // Câmpuri adiționale pentru UI
  user_name?: string;
  user_avatar?: string;
  formatted_date?: string;
  formatted_time?: string;
  action_description?: string;
}

export interface InsertActivityLog {
  organization_id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  metadata?: any;
}

export interface ActivityFilter {
  entity_type?: string[];
  user_id?: number[];
  date_range?: { from: Date; to: Date };
  action?: string[];
}

export interface ActivityStats {
  total_activities: number;
  activities_by_entity: { [key: string]: number };
  activities_by_user: { [key: string]: number };
  activities_by_date: { [key: string]: number };
  most_active_users: { user_id: number; user_name: string; count: number }[];
  most_active_projects: { project_id: number; project_name: string; count: number }[];
}