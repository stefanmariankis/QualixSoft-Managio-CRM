/**
 * Tipuri pentru task-uri
 */

import type { Priority, TaskStatus, Comment, Attachment } from './common.types';

export interface Task {
  id: number;
  organization_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee_id?: number | null;
  created_by: number;
  start_date?: Date | null;
  due_date?: Date | null;
  estimated_hours?: number | null;
  completion_percentage: number;
  parent_task_id?: number | null;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  project_name?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  created_by_name?: string;
  parent_task_title?: string;
  subtask_count?: number;
  comments?: Comment[];
  attachments?: Attachment[];
  is_overdue?: boolean;
}

export interface InsertTask {
  organization_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee_id?: number | null;
  created_by: number;
  start_date?: Date | null;
  due_date?: Date | null;
  estimated_hours?: number | null;
  completion_percentage?: number;
  parent_task_id?: number | null;
}

export interface UpdateTask {
  project_id?: number;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  assignee_id?: number | null;
  start_date?: Date | null;
  due_date?: Date | null;
  estimated_hours?: number | null;
  completion_percentage?: number;
  parent_task_id?: number | null;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  project_id?: number[];
  assignee_id?: number[];
  created_by?: number[];
  due_date_range?: { from: Date; to: Date };
  start_date_range?: { from: Date; to: Date };
  parent_task_id?: number | null;
  search?: string;
}

export interface TaskStats {
  total: number;
  not_started: number;
  in_progress: number;
  under_review: number;
  completed: number;
  cancelled: number;
  on_hold: number;
  overdue: number;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
  
  // Câmpuri adiționale pentru UI
  user_name?: string;
  user_avatar?: string;
}

export interface InsertTaskComment {
  task_id: number;
  user_id: number;
  comment: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: Date;
  
  // Câmpuri adiționale pentru UI
  user_name?: string;
  display_size?: string;
}

export interface InsertTaskAttachment {
  task_id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}