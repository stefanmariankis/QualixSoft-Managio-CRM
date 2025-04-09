/**
 * Tipuri comune utilizate în mai multe locuri din aplicație
 */

// Tipuri de organizație
export enum OrganizationType {
  INDIVIDUAL = 'individual',
  AGENCY = 'agency',
  COMPANY = 'company'
}

// Planuri de abonament
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Rolurile utilizatorilor
export type UserRole = 'super_admin' | 'ceo' | 'manager' | 'director' | 'employee' | 'client';

// Rolurile membrilor echipei
export type TeamMemberRole = 'ceo' | 'manager' | 'employee' | 'collaborator' | 'associate';

// Statusuri comune
export type ProjectStatus = 'active' | 'inactive' | 'completed' | 'cancelled' | 'on_hold' | 'archived';
export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'under_review';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

// Tipul de trigger pentru automatizări
export type AutomationTriggerType = 
  'on_create' | 
  'on_update' | 
  'on_status_change' | 
  'on_deadline' | 
  'on_assignment' | 
  'on_comment' | 
  'on_payment' | 
  'on_schedule';

// Tipul de acțiune pentru automatizări
export type AutomationActionType = 
  'send_notification' | 
  'change_status' | 
  'assign_task' | 
  'send_email' | 
  'create_task' | 
  'add_tag' | 
  'move_project' | 
  'schedule_event';

// Status execuție automatizare
export type AutomationExecutionStatus = 'success' | 'failed' | 'pending';

// Prioritate
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

// Tipuri de diferite entități din sistem
export type EntityType = 
  'user' | 
  'client' | 
  'project' | 
  'task' | 
  'invoice' | 
  'payment' | 
  'department' | 
  'team_member' | 
  'organization' | 
  'comment' | 
  'automation';

// Recursive partial type pentru tipuri complexe
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

// Enum pentru puterea parolei
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong'
}