/**
 * TYPES: Asana API Response Types
 * 
 * Interfacce per le risposte dell'API Asana
 */

// Lista task (search endpoint)
export interface AsanaTaskListItem {
  gid: string;
  name: string;
  completed: boolean;
  memberships: Array<{
    section: {
      name: string;
    };
  }>;
  resource_type: string;
  resource_subtype: string;
}

export interface AsanaTaskListResponse {
  data: AsanaTaskListItem[];
}

// Dettaglio task (singolo task endpoint)
export interface AsanaCustomField {
  gid: string;
  enabled: boolean;
  name: string;
  description: string;
  created_by: {
    gid: string;
    name: string;
    resource_type: string;
  };
  display_value: string | null;
  resource_subtype: string;
  resource_type: string;
  text_value: string | null;
  is_formula_field: boolean;
  is_value_read_only: boolean;
  type: string;
}

export interface AsanaUser {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaAttachment {
  gid: string;
  name: string;
  url: string;
  created_at: string;
  resource_type: string;
}

export interface AsanaMembership {
  project: {
    gid: string;
    name: string;
    resource_type: string;
  };
  section: {
    gid: string;
    name: string;
    resource_type: string;
  };
}

export interface AsanaProject {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resource_type: string;
}

export interface AsanaTaskDetail {
  gid: string;
  actual_time_minutes: number | null;
  assignee: AsanaUser | null;
  assignee_status: string;
  attachments?: AsanaAttachment[];
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  custom_fields: AsanaCustomField[];
  due_at: string | null;
  due_on: string | null;
  followers: AsanaUser[];
  hearted: boolean;
  hearts: any[];
  liked: boolean;
  likes: any[];
  memberships: AsanaMembership[];
  modified_at: string;
  name: string;
  notes: string;
  num_hearts: number;
  num_likes: number;
  parent: any | null;
  permalink_url: string;
  projects: AsanaProject[];
  resource_type: string;
  start_at: string | null;
  start_on: string | null;
  tags: any[];
  resource_subtype: string;
  workspace: AsanaWorkspace;
}

export interface AsanaTaskDetailResponse {
  data: AsanaTaskDetail;
}
