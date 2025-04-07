/**
 * Tipuri pentru automatizări
 */

import type { AutomationActionType, AutomationExecutionStatus, AutomationTriggerType } from './common.types';

export interface Automation {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  trigger_types: AutomationTriggerType[];
  action_types: AutomationActionType[];
  execution_count: number;
  last_execution_status: AutomationExecutionStatus | null;
  last_execution_time: Date | null;
  
  // Câmpuri adiționale pentru UI
  created_by_name?: string;
  updated_by_name?: string;
  trigger_count?: number;
  action_count?: number;
  triggers?: AutomationTrigger[];
  actions?: AutomationAction[];
}

export interface InsertAutomation {
  organization_id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_by: number;
  trigger_types: AutomationTriggerType[];
  action_types: AutomationActionType[];
}

export interface UpdateAutomation {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  updated_by: number;
  trigger_types?: AutomationTriggerType[];
  action_types?: AutomationActionType[];
}

export interface AutomationTrigger {
  id: number;
  automation_id: number;
  trigger_type: AutomationTriggerType;
  entity_type: string;
  conditions: AutomationCondition; // Condiții specifice pentru acest trigger
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationCondition {
  field?: string;
  operator?: string;
  value?: any;
  additional_params?: Record<string, any>;
}

export interface InsertAutomationTrigger {
  automation_id: number;
  trigger_type: AutomationTriggerType;
  entity_type: string;
  conditions: AutomationCondition;
  order_index: number;
}

export interface AutomationAction {
  id: number;
  automation_id: number;
  action_type: AutomationActionType;
  action_config: AutomationActionConfig;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationActionConfig {
  template_id?: number;
  entity_type?: string;
  status?: string;
  user_id?: number;
  message?: string;
  email_template_id?: number;
  recipient_type?: string;
  task_template_id?: number;
  tag_ids?: number[];
  subject?: string;
  body?: string;
  recipients?: string[];
  additional_params?: Record<string, any>;
}

export interface InsertAutomationAction {
  automation_id: number;
  action_type: AutomationActionType;
  action_config: AutomationActionConfig;
  order_index: number;
}

export interface AutomationLog {
  id: number;
  automation_id: number;
  trigger_id: number | null;
  entity_type: string;
  entity_id: number;
  execution_status: AutomationExecutionStatus;
  error_message: string | null;
  executed_at: Date;
  created_at: Date;
  
  // Câmpuri adiționale pentru UI
  automation_name?: string;
  entity_name?: string;
}

export interface InsertAutomationLog {
  automation_id: number;
  trigger_id?: number | null;
  entity_type: string;
  entity_id: number;
  execution_status: AutomationExecutionStatus;
  error_message?: string | null;
}

export interface AutomationStats {
  total: number;
  active: number;
  inactive: number;
  executions: {
    total: number;
    success: number;
    failed: number;
    pending: number;
  };
  most_used_triggers: { trigger_type: string; count: number }[];
  most_used_actions: { action_type: string; count: number }[];
}