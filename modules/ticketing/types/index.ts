/**
 * MODULE: Ticketing System
 * 
 * Tipi TypeScript per il modulo Ticketing
 * Definisce le interfacce base per ticket, stati e priorità
 */

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
  isSystemMessage?: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: Assignee;
  tags?: string[];
  dueDate?: Date;
  commentsCount?: number;
  attachmentsCount?: number;
  comments?: Comment[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
