/**
 * Tipuri pentru sistemul de notificări
 */

import type { EntityType } from './common.types';

// Tipuri de notificări
export type NotificationType = 
  'task_assigned' | 
  'task_completed' | 
  'task_deadline' | 
  'comment_added' | 
  'project_update' | 
  'invoice_status' | 
  'payment_received' | 
  'team_member_added' | 
  'system_alert';

// Nivel de prioritate pentru notificări
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Stare de citire pentru notificări
export type NotificationReadStatus = 'unread' | 'read';

// Interfața principală pentru notificări
export interface Notification {
  id: number;
  organization_id: number;
  recipient_id: number;
  sender_id?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read_status: NotificationReadStatus;
  entity_type: EntityType;
  entity_id?: number | null;
  action_url?: string | null;
  created_at: Date;
  expires_at?: Date | null;
  
  // Câmpuri adiționale pentru UI
  sender_name?: string;
  sender_avatar?: string;
  time_ago?: string;
  is_new?: boolean;
}

// Pentru inserare în baza de date
export interface InsertNotification {
  organization_id: number;
  recipient_id: number;
  sender_id?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read_status: NotificationReadStatus;
  entity_type: EntityType;
  entity_id?: number | null;
  action_url?: string | null;
  expires_at?: Date | null;
}

// Pentru actualizarea notificărilor
export interface UpdateNotification {
  read_status?: NotificationReadStatus;
  expires_at?: Date | null;
}

// Preferințe notificări pentru un utilizator
export interface NotificationPreferences {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  browser_notifications: boolean;
  task_assigned: boolean;
  task_completed: boolean;
  task_deadline: boolean;
  comment_added: boolean;
  project_update: boolean;
  invoice_status: boolean;
  payment_received: boolean;
  team_member_added: boolean;
  system_alert: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  created_at: Date;
  updated_at: Date;
}

// Statistici notificări
export interface NotificationStats {
  total: number;
  unread: number;
  high_priority: number;
  by_type: Record<NotificationType, number>;
}